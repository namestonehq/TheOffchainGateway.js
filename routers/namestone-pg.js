import { Record } from "@resolverworks/enson";
import { log, safe_name } from "../src/utils.js";
import { SmartCache } from "../src/SmartCache.js";
import postgres from "postgres";

const sql = postgres(process.env.NAMESTONE_PG);
// why doesn't this library expose connect/disconnect events?

const domain_cache = new SmartCache();
const record_cache = new SmartCache();

export default {
  //slug: 'namestone',
  async resolve(name) {
    const MIN = 2; // currently every domain is "a.b"
    let labels = name.split(".");
    if (labels.length < MIN) return;
    let basename = labels.splice(labels.length - MIN, MIN).join(".");
    let domain = await domain_cache.get(basename, find_domain);
    if (!domain) return; // silent

    if (labels.length === 0) {
      return record_cache.get(name, () => get_domain_record(domain));
    } else {
      return record_cache.get(name, () =>
        get_sub_record(domain, labels.join("."))
      );
    }
  },
};

async function find_domain(name) {
  log(`namestone domain: ${safe_name(name)}`);
  let [domain] = await sql`SELECT * FROM domain WHERE name = ${name} LIMIT 1`;
  return domain;
}

async function get_domain_record(domain) {
  let [[{ n }], texts, coins] = await Promise.all([
    sql`SELECT COUNT(*) AS n FROM subdomain WHERE domain_id = ${domain.id}`,
    sql`SELECT * FROM domain_text_record WHERE domain_id = ${domain.id}`,
    sql`SELECT * FROM domain_coin_type WHERE domain_id = ${domain.id}`,
  ]);
  let rec = new Record();
  rec.set(
    "notice",
    `ID(${domain.id}) Count(${n}/${
      domain.name_limit || "∞"
    }) Created(${domain.created_at.toISOString()})`
  );
  if (domain.address) rec.setAddress(60, domain.address);
  if (domain.contenthash) rec.setChash(domain.contenthash);
  for (let { key, value } of texts) rec.setText(key, value);
  for (let { coin_type, address } of coins)
    rec.setAddress(BigInt(coin_type), address);
  return rec;
}

async function get_sub_record(domain, name) {
  let [subdomain] =
    await sql`SELECT * FROM subdomain WHERE domain_id = ${domain.id} AND name = ${name} LIMIT 1`;
  if (!subdomain) return; // silent
  let [texts, coins] = await Promise.all([
    sql`SELECT * FROM subdomain_text_record WHERE subdomain_id = ${subdomain.id}`,
    sql`SELECT * FROM subdomain_coin_type WHERE subdomain_id = ${subdomain.id}`,
  ]);
  let rec = new Record();
  rec.set(
    "notice",
    `ID(${domain.id}:${
      subdomain.id
    }) Created(${subdomain.created_at.toISOString()})`
  );
  if (subdomain.address) rec.setAddress(60, subdomain.address);
  if (subdomain.contenthash) rec.setChash(subdomain.contenthash);
  for (let { key, value } of texts) rec.setText(key, value);
  for (let { coin_type, address } of coins)
    rec.setAddress(BigInt(coin_type), address);
  return rec;
}
