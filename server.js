import { createServer, IncomingMessage, OutgoingMessage } from "node:http";
import { EZCCIP } from "@namestone/ezccip";
import { ethers } from "ethers";
import { log, error_with } from "./src/utils.js";
import { ROUTERS, TOR_DEPLOYS, TOR_DEPLOY0 } from "./config.js";

IncomingMessage.prototype.read_body = async function () {
  let v = [];
  for await (const x of this) v.push(x);
  return Buffer.concat(v);
};
IncomingMessage.prototype.read_json = async function () {
  try {
    return JSON.parse(await this.read_body());
  } catch (err) {
    throw error_with("malformed JSON", { status: 422 }, err);
  }
};
OutgoingMessage.prototype.json = function (json) {
  let buf = Buffer.from(
    JSON.stringify(json, (k, v) => {
      if (v instanceof Uint8Array) return ethers.hexlify(v);
      return v;
    })
  );
  this.setHeader("Content-Length", buf.length);
  this.setHeader("Content-Type", "application/json");
  this.end(buf);
};

const PORT = parseInt(process.env.HTTP_PORT);

const signingKey = new ethers.SigningKey(process.env.PRIVATE_KEY); // throws
const signer = ethers.computeAddress(signingKey);

const routers = new Map();
function require_router(slug) {
  let router = routers.get(slug);
  if (!router)
    throw error_with(`router not found: "${slug}"`, { status: 404, slug });
  return router;
}

function sendResolutionLog({ name, gateway, router, contract, ip }) {
  fetch("https://namestone-reporting.onrender.com/api/log_resolution", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      gateway,
      router,
      contract,
      ip,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Log submitted:", data);
    })
    .catch((error) => {
      console.error("Error submitting log:", error);
    });
}

const ezccip = new EZCCIP();
ezccip.enableENSIP10((name, context, history) => {
  // RESOLUTION LOG
  console.log(
    `RESOLUTION LOG,  name: ${name}, router: ${
      context.router.slug
    }, contract: ${context.resolver}, ip: ${
      context.ip
    }, searchParams: ${JSON.stringify(
      context.searchParams
    )}, history: ${history.toString()}`
  );
  return context.router.resolve(name, context, history);
});

const http = createServer(async (req, reply) => {
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  try {
    let url = new URL(req.url, "http://a");
    reply.setHeader("access-control-allow-origin", "*");
    switch (req.method) {
      case "GET": {
        if (url.pathname === "/") {
          return reply.json({
            greeting: "Hello from TheOffchainGateway!",
            signer,
            routers: [...routers.keys()],
            TOR_DEPLOYS,
          });
        }
        let [slug, path] = drop_path_component(url.pathname);
        if (slug) {
          let router = require_router(slug);
          await router.GET?.({ req, reply, path, url });
          if (reply.writableEnded) {
            log(ip, router.slug, "GET", path);
            return;
          }
        }
        throw error_with("file not found", { status: 404 });
      }
      case "OPTIONS":
        return reply.setHeader("access-control-allow-headers", "*").end();
      case "POST": {
        let [slug, rest] = drop_path_component(url.pathname);
        let router = require_router(slug);
        let [deploy] = drop_path_component(rest);
        if (!deploy) deploy = router.deploy ?? TOR_DEPLOY0;
        let resolver = TOR_DEPLOYS[deploy];
        if (!resolver)
          throw error_with(`resolver "${deploy}" not found`, { status: 404 });
        let { sender, data: calldata } = await req.read_json();
        let { data, history } = await ezccip.handleRead(sender, calldata, {
          signingKey,
          resolver,
          origin: resolver,
          router,
          routers,
          ip,
          searchParams: url.searchParams,
        });
        if (history.toString().includes(".addr()")) {
          const name = history
            .toString()
            .split(").addr()")[0]
            .split("resolve(")[1];
          sendResolutionLog({
            name: name,
            gateway: "OffchainGateway",
            router: router.slug,
            contract: deploy.toString(),
            ip: ip,
          });
        }
        log(ip, `${router.slug}/${deploy}`, history.toString());
        return reply.json({ data });
      }
      default:
        throw error_with("unsupported http method", { status: 405 });
    }
  } catch (err) {
    let { message, status } = err;
    if (status) {
      log(ip, req.method, req.url, status, message);
    } else {
      log(ip, req.method, req.url, err);
      status = 500;
      message = "unknown error";
    }
    reply.statusCode = status;
    reply.json({ message });
  }
});

for (let r of ROUTERS) {
  try {
    if (!r.slug || !/^[a-z0-9-]+$/.test(r.slug))
      throw new Error("expected slug");
    let other = routers.get(r.slug);
    if (other === r) continue; // already exists
    if (other) throw new Error(`duplicate slug: ${r.slug}`);
    routers.set(r.slug, r);
    await r.init?.(ezccip);
    log(r.slug, "ready");
  } catch (err) {
    throw error_with("router init", { router: r }, err);
  }
}
if (!routers.size) throw new Error(`expected a Router`);

// start server
http.listen(PORT).once("listening", () => {
  console.log(`Signer: ${signer}`);
  console.log("Routers:", [...routers.keys()]);
  console.log("Deploys:", TOR_DEPLOYS);
  console.log(`Listening on ${http.address().port}`);
});

function drop_path_component(s) {
  if (!s) return [];
  let i = s.indexOf("/", 1);
  if (i < 1) return [s.slice(1)];
  return [s.slice(1, i), s.slice(i)];
}
