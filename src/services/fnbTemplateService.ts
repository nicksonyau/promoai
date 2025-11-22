import { Env } from "../index";

export async function getTemplateById(env: Env, id: string) {
  return await env.KV.get(`template:${id}`, "json");
}

export async function saveTemplate(env: Env, template: any) {
  await env.KV.put(`template:${template.id}`, JSON.stringify(template));
  return template;
}

export async function deleteTemplateById(env: Env, id: string) {
  const key = `template:${id}`;
  const existing = await env.KV.get(key);
  if (!existing) return false;
  await env.KV.delete(key);
  return true;
}