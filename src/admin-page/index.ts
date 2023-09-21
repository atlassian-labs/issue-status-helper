import Resolver from "@forge/resolver";
import { storage } from "@forge/api";

const resolver = new Resolver();

resolver.define("loadData", async ({ payload, context }) => {
  const data = await storage.get(payload.key);
  return data;
});

resolver.define("saveData", async ({ payload, context }) => {
  await storage.set(payload.key, payload.value);
});

export const handler = resolver.getDefinitions();
