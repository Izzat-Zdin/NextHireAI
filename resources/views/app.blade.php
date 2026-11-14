<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="NextHire AI: interview practice and career readiness platform" />
    <meta name="color-scheme" content="light dark" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <link rel="icon" href="/favicon.svg" />
    <title inertia>NextHire AI</title>
    <script>
      // Apply the saved or system theme before first paint (avoids a light flash in dark mode).
      try {
        var t = localStorage.getItem("nexthire-theme") || "system"
        if (t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
          document.documentElement.classList.add("dark")
        }
      } catch (e) {}
    </script>
    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
  </head>
  <body>
    @inertia
  </body>
</html>
