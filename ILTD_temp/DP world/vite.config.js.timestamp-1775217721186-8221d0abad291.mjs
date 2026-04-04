// vite.config.js
import { defineConfig } from "file:///C:/Users/septs/OneDrive/Desktop/clear%20path/DP%20world/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/septs/OneDrive/Desktop/clear%20path/DP%20world/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/septs/OneDrive/Desktop/clear%20path/DP%20world/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/auth": { target: "http://localhost:3001", changeOrigin: true },
      "/cha": { target: "http://localhost:3001", changeOrigin: true },
      "/govt": { target: "http://localhost:3001", changeOrigin: true },
      "/complaints": { target: "http://localhost:3001", changeOrigin: true },
      "/admin": { target: "http://localhost:3001", changeOrigin: true },
      "/health": { target: "http://localhost:3001", changeOrigin: true }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzZXB0c1xcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXGNsZWFyIHBhdGhcXFxcRFAgd29ybGRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHNlcHRzXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcY2xlYXIgcGF0aFxcXFxEUCB3b3JsZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvc2VwdHMvT25lRHJpdmUvRGVza3RvcC9jbGVhciUyMHBhdGgvRFAlMjB3b3JsZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXG5cbi8vIGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2F1dGgnOiB7IHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxuICAgICAgJy9jaGEnOiB7IHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxuICAgICAgJy9nb3Z0JzogeyB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLCBjaGFuZ2VPcmlnaW46IHRydWUgfSxcbiAgICAgICcvY29tcGxhaW50cyc6IHsgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAxJywgY2hhbmdlT3JpZ2luOiB0cnVlIH0sXG4gICAgICAnL2FkbWluJzogeyB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLCBjaGFuZ2VPcmlnaW46IHRydWUgfSxcbiAgICAgICcvaGVhbHRoJzogeyB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLCBjaGFuZ2VPcmlnaW46IHRydWUgfSxcbiAgICB9LFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlYsU0FBUyxvQkFBb0I7QUFDMVgsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBR3hCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUEsRUFDaEMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsU0FBUyxFQUFFLFFBQVEseUJBQXlCLGNBQWMsS0FBSztBQUFBLE1BQy9ELFFBQVEsRUFBRSxRQUFRLHlCQUF5QixjQUFjLEtBQUs7QUFBQSxNQUM5RCxTQUFTLEVBQUUsUUFBUSx5QkFBeUIsY0FBYyxLQUFLO0FBQUEsTUFDL0QsZUFBZSxFQUFFLFFBQVEseUJBQXlCLGNBQWMsS0FBSztBQUFBLE1BQ3JFLFVBQVUsRUFBRSxRQUFRLHlCQUF5QixjQUFjLEtBQUs7QUFBQSxNQUNoRSxXQUFXLEVBQUUsUUFBUSx5QkFBeUIsY0FBYyxLQUFLO0FBQUEsSUFDbkU7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
