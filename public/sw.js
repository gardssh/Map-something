if(!self.define){let e,a={};const n=(n,s)=>(n=new URL(n+".js",s).href,a[n]||new Promise((a=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=a,document.head.appendChild(e)}else e=n,importScripts(n),a()})).then((()=>{let e=a[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(s,c)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(a[i])return;let t={};const r=e=>n(e,i),o={module:{uri:i},exports:t,require:r};a[i]=Promise.all(s.map((e=>o[e]||r(e)))).then((e=>(c(...e),t)))}}define(["./workbox-1bb06f5e"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/Circle Dot.svg",revision:"f2642b7597856ad1f4e774b87bc2c0d5"},{url:"/IMG_9790.jpeg",revision:"e1c033d9f05db865e412088d5974546d"},{url:"/_next/app-build-manifest.json",revision:"0796e067f399d8d9942725278d55adf3"},{url:"/_next/static/chunks/23-eb804cfcfe20ed52.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/316-0a49e589057d9901.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/35.03ae917f238a8966.js",revision:"03ae917f238a8966"},{url:"/_next/static/chunks/392-46ee6c01d5f0b811.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/515-88182d41850e08ff.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/648-e06612bce822c1f0.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/843-375fa75af9935f2d.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/868-5c181aa27b3d9d67.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/998-366dc0a610bbce57.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/app/_not-found/page-df2232df90b1b153.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/app/forgot-password/page-48c1c82e20dcfb6c.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/app/layout-abee294a15ab8f62.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/app/login/page-8a0223dd652695f2.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/app/page-60770b81923f8c19.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/app/profile/page-7ac36308eb26e235.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/app/signup/page-0cb4652965d66d36.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/app/test-avalanche/page-5edf104f94a68096.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/c36f3faa-7b7fc454fd80d508.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/fd9d1056-858637d525bb3ac1.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/framework-00a8ba1a63cfdc9e.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/main-app-3ab61de64cf707c6.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/main-f3cdcd93c306aa15.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/pages/_app-037b5d058bd9a820.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/pages/_error-bdd764fd77be4fcf.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js",revision:"79330112775102f91e1010318bae2bd3"},{url:"/_next/static/chunks/webpack-07f27add909fff1d.js",revision:"xhITHupMSj4e2cGXBoJnB"},{url:"/_next/static/css/83dc1c78039dc66a.css",revision:"83dc1c78039dc66a"},{url:"/_next/static/css/e574c2ca5595c408.css",revision:"e574c2ca5595c408"},{url:"/_next/static/media/26a46d62cd723877-s.woff2",revision:"befd9c0fdfa3d8a645d5f95717ed6420"},{url:"/_next/static/media/55c55f0601d81cf3-s.woff2",revision:"43828e14271c77b87e3ed582dbff9f74"},{url:"/_next/static/media/581909926a08bbc8-s.woff2",revision:"f0b86e7c24f455280b8df606b89af891"},{url:"/_next/static/media/6d93bde91c0c2823-s.woff2",revision:"621a07228c8ccbfd647918f1021b4868"},{url:"/_next/static/media/97e0cb1ae144a2a9-s.woff2",revision:"e360c61c5bd8d90639fd4503c829c2dc"},{url:"/_next/static/media/a34f9d1faa5f3315-s.p.woff2",revision:"d4fe31e6a2aebc06b8d6e558c9141119"},{url:"/_next/static/media/df0a9ae256c0569c-s.woff2",revision:"d54db44de5ccb18886ece2fda72bdfe0"},{url:"/_next/static/xhITHupMSj4e2cGXBoJnB/_buildManifest.js",revision:"bcdc107853fa82ff195977f1a9d2419b"},{url:"/_next/static/xhITHupMSj4e2cGXBoJnB/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/aktiviteter.json",revision:"b4505aabfb47137954bf7338ff0eba1e"},{url:"/avalanche/dangerLevelDry/Icon-Avalanche-Danger-Level-Dry-Snow-1-EAWS.png",revision:"1f83903c47a1d6363848d426dbdffb72"},{url:"/avalanche/dangerLevelDry/Icon-Avalanche-Danger-Level-Dry-Snow-2-EAWS.png",revision:"af5ff1cbbb376ac3e31e17672dbe77ad"},{url:"/avalanche/dangerLevelDry/Icon-Avalanche-Danger-Level-Dry-Snow-3-EAWS.png",revision:"4bc497dc9287a98531011772b4827d53"},{url:"/avalanche/dangerLevelDry/Icon-Avalanche-Danger-Level-Dry-Snow-4-5-EAWS.png",revision:"8ac5ad49785283175b2a56491fa21d08"},{url:"/avalanche/dangerLevelDry/Icon-Avalanche-Danger-Level-No-Rating-EAWS.png",revision:"565761eaf99a2bf58878f432092532d0"},{url:"/avalanche/dangerLevelWet/Icon-Avalanche-Danger-Level-No-Rating-EAWS.png",revision:"565761eaf99a2bf58878f432092532d0"},{url:"/avalanche/dangerLevelWet/Icon-Avalanche-Danger-Level-Wet-Snow-1-EAWS.png",revision:"6ae52b05a5954c894cbd0d58e4ea3887"},{url:"/avalanche/dangerLevelWet/Icon-Avalanche-Danger-Level-Wet-Snow-2-EAWS.png",revision:"e081008ae02c5360029958b8ee0c4318"},{url:"/avalanche/dangerLevelWet/Icon-Avalanche-Danger-Level-Wet-Snow-3-EAWS.png",revision:"a5d5249738beed2fa43818e4731b44d3"},{url:"/avalanche/dangerLevelWet/Icon-Avalanche-Danger-Level-Wet-Snow-4-5-EAWS.png",revision:"7d5a631548ca12d5cf725db01517fc6b"},{url:"/avalanche/problems/Icon-Avalanche-Problem-Gliding-Snow-EAWS.svg",revision:"abddb37d13e6f9f799f9098f2b1a45c4"},{url:"/avalanche/problems/Icon-Avalanche-Problem-New-Snow-EAWS.svg",revision:"3142736786e3390fce9a3a7a9fbd5fea"},{url:"/avalanche/problems/Icon-Avalanche-Problem-Persistent-Weak-Layer-EAWS.svg",revision:"cf09643c4b6606509d33ed8d1599ad00"},{url:"/avalanche/problems/Icon-Avalanche-Problem-Wet-Snow-EAWS.svg",revision:"8e374b512fdab3015a0149f87ed4a318"},{url:"/avalanche/problems/Icon-Avalanche-Problem-Wind-Slab-EAWS.svg",revision:"b246fbad5babda6ff7579a72a3734762"},{url:"/favicon.svg",revision:"aee9be50f604cfb16a6116a0aa268f1e"},{url:"/manifest.json",revision:"8f251b362eaec8c051e7c9311a67197e"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/routes.json",revision:"808a9537f880332d1cbf683e58128b31"},{url:"/vercel.svg",revision:"61c6b19abff40ea7acd577be818f3976"},{url:"/waypoints.json",revision:"0c22a8fe9df7c02d5e4c65daae0d32d5"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:a,event:n,state:s})=>a&&"opaqueredirect"===a.type?new Response(a.body,{status:200,statusText:"OK",headers:a.headers}):a}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const a=e.pathname;return!a.startsWith("/api/auth/")&&!!a.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
