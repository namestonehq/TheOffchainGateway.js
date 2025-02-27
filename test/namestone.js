import R from "../routers/namestone-pg.js";

// node --env-file=.env test/namestone.js

let rec = await R.resolve("wassies.namestone.eth");

console.log(rec);
console.log(rec.toObject());
console.log(rec.toJSON());

let rec2 = await R.resolve("slobo.nfty.eth");
console.log(rec2);
console.log(rec2.toObject());
console.log(rec2.toJSON());
