const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = { window: {}, document: { addEventListener() {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/pusg-story.js'), 'utf8'), context);
const source = fs.readFileSync(path.join(root, 'js/lq-posts.js'), 'utf8').replace('    document.addEventListener("DOMContentLoaded", function () {', '    window.sharingPosts = posts;\n    document.addEventListener("DOMContentLoaded", function () {');
vm.runInContext(source, context);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const template = fs.readFileSync(path.join(root,'post.html'),'utf8');
fs.mkdirSync(path.join(root,'stories'),{recursive:true});
const redirects=[];
for(const post of context.window.sharingPosts){
 const url = `https://lawyersquarters.com/stories/${post.slug}.html`;
 const image = new URL(post.image,'https://lawyersquarters.com/').href;
 const metadata = `<base href="/">\n<link rel="canonical" href="${url}">\n<meta property="og:type" content="article">\n<meta property="og:site_name" content="Lawyers Quarters">\n<meta property="og:title" content="${escape(post.title)}">\n<meta property="og:description" content="${escape(post.excerpt)}">\n<meta property="og:url" content="${url}">\n<meta property="og:image" content="${image}">\n<meta property="og:image:alt" content="${escape(post.alt)}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${escape(post.title)}">\n<meta name="twitter:description" content="${escape(post.excerpt)}">\n<meta name="twitter:image" content="${image}">`;
 const html=template.replace('<head>','<head>\n'+metadata).replace(/<title>.*?<\/title>/,`<title>${escape(post.title)} | Lawyers Quarters</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(post.excerpt)}">`);
 fs.writeFileSync(path.join(root,'stories',post.slug+'.html'),html);
 redirects.push({source:'/post.html',has:[{type:'query',key:'slug',value:post.slug}],destination:'/stories/'+post.slug+'.html',permanent:true});
}
fs.writeFileSync(path.join(root,'vercel.json'),JSON.stringify({buildCommand:'node scripts/build-sharing.cjs',outputDirectory:'.',redirects},null,2)+'\n');
console.log(`Built ${redirects.length} article pages with social metadata.`);
