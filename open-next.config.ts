import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Sem cache incremental: todas as páginas leem do D1 a cada acesso, então não há ISR para guardar.
export default defineCloudflareConfig({});
