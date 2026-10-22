"""Publica el siguiente articulo programado de la cola (.programados/queue.json).

Uso:  python .programados/publicar.py [--dry-run] [--force]

--force ignora la hora (publica ya el siguiente pendiente). Sin --force solo
publica si ya ha llegado la fecha/hora de la cola (hora de Madrid).
"Pendiente" = su pagina aun no existe en la raiz del sitio.

Pasos: mueve la pagina a la raiz, inserta su tarjeta AL PRINCIPIO de blog.html,
index.html e index-completo.html, anade la URL a sitemap.xml, hace commit con
SOLO esos archivos (mas sus imagenes img/blog/<slug>*.jpg si existen) y push.
Es idempotente: no publica dos veces el mismo articulo.
"""
import json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
Q = os.path.join(ROOT, ".programados")
QF = os.path.join(Q, "queue.json")
DRY = "--dry-run" in sys.argv
FORCE = "--force" in sys.argv
MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]


def git(*args, check=True):
    r = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    if check and r.returncode != 0:
        raise SystemExit("git %s fallo:\n%s%s" % (" ".join(args), r.stdout, r.stderr))
    return r.stdout.strip()


def fecha_txt(when):
    d, t = when.split("T")
    y, m, dd = d.split("-")
    return "%d de %s de %s a las %s" % (int(dd), MESES[int(m) - 1], y, t)


def card_blog(it):
    return '''        <div data-date="%(when)s" data-aos="fade-up" data-aos-delay="100" class="h-full">
          <article class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-2xl focus-within:ring-2 focus-within:ring-brand/50">
            <div class="aspect-[16/10] overflow-hidden bg-soft">
              <img src="img/blog/%(slug)s.jpg" alt="%(alt)s" width="1200" height="750" loading="lazy" decoding="async"
                   class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                   onerror="this.onerror=null;this.src='img/blog/placeholder.svg'">
            </div>
            <div class="flex flex-1 flex-col p-6">
              <div class="mb-3 flex flex-wrap items-center gap-3 text-xs">
                <span class="rounded-full bg-soft px-3 py-1 font-bold uppercase tracking-wide text-brand">%(tag)s</span>
                <span class="text-muted">⏱ %(mins)s min de lectura</span>
              </div>
              <p class="mt-0 mb-2 text-xs text-muted">📅 <time class="pub-date" datetime="%(when)s">%(txt)s</time></p>
              <h2 class="mt-0 mb-2 text-xl font-extrabold leading-snug text-navy">%(title)s</h2>
              <p class="mt-0 mb-5 line-clamp-3 text-sm leading-relaxed text-muted">%(summary)s</p>
              <a href="%(slug)s.html" class="mt-auto inline-flex items-center gap-1 font-bold text-brand after:absolute after:inset-0 after:content-[''] focus:outline-none">Leer artículo completo →</a>
            </div>
          </article>
        </div>
''' % dict(it, txt=fecha_txt(it["when"]))


def card_index(it):
    return '''      <div data-date="%(when)s" data-aos="fade-up" data-aos-delay="100">
        <article class="post-card">
          <span class="post-tag">%(tag)s</span>
          <p class="post-date">📅 <time class="pub-date" datetime="%(when)s">%(txt)s</time></p>
          <h3>%(title)s</h3>
          <p>%(summary)s</p>
          <a class="read-more" href="%(slug)s.html">Leer el artículo →</a>
        </article>
      </div>
''' % dict(it, txt=fecha_txt(it["when"]))


def insert_top(path, list_id, card, slug):
    s = open(path, encoding="utf-8").read()
    if ('href="%s.html"' % slug) in s:
        return False
    i = s.index('id="%s"' % list_id)
    j = s.index("-->", i) + 3
    j = s.index("\n", j) + 1
    s = s[:j] + card + s[j:]
    open(path, "w", encoding="utf-8", newline="").write(s)
    return True


def main():
    queue = json.load(open(QF, encoding="utf-8"))
    pend = [q for q in queue if not os.path.exists(os.path.join(ROOT, q["slug"] + ".html"))]
    if not pend:
        print("Cola vacia: no queda nada por publicar.")
        return
    it = pend[0]
    slug = it["slug"]
    if not FORCE:
        try:
            from zoneinfo import ZoneInfo
            from datetime import datetime
            ahora = datetime.now(ZoneInfo("Europe/Madrid")).strftime("%Y-%m-%dT%H:%M")
        except Exception:
            from datetime import datetime
            ahora = datetime.now().strftime("%Y-%m-%dT%H:%M")  # sin tzdata: hora local del equipo
        if ahora is not None and ahora < it["when"]:
            print("Aun no toca: %s esta programado para %s (ahora %s en Madrid)." % (slug, it["when"], ahora))
            return
    src = os.path.join(Q, slug + ".html")
    dst = os.path.join(ROOT, slug + ".html")
    if DRY:
        print("DRY RUN: publicaria", slug, it["when"])
        return

    # Trabajar sobre lo ultimo de origin sin pisar cambios ajenos
    git("fetch", "origin")
    if git("rev-list", "--count", "HEAD..origin/main") != "0":
        git("pull", "--rebase", "--autostash", "origin", "main")

    shutil.copyfile(src, dst)
    insert_top(os.path.join(ROOT, "blog.html"), "post-list", card_blog(it), slug)
    insert_top(os.path.join(ROOT, "index.html"), "blog-preview-list", card_index(it), slug)
    insert_top(os.path.join(ROOT, "index-completo.html"), "blog-preview-list", card_index(it), slug)

    sm = os.path.join(ROOT, "sitemap.xml")
    s = open(sm, encoding="utf-8").read()
    loc = "https://calculadoramudanzas.es/%s.html" % slug
    if loc not in s:
        entry = "  <url><loc>%s</loc><lastmod>%s</lastmod></url>\n" % (loc, it["when"].split("T")[0])
        s = s.replace("</urlset>", entry + "</urlset>")
        open(sm, "w", encoding="utf-8", newline="").write(s)

    files = [slug + ".html", "blog.html", "index.html", "index-completo.html", "sitemap.xml"]
    imgs = [f for f in os.listdir(os.path.join(ROOT, "img", "blog")) if f.startswith(slug) and f.endswith((".jpg", ".webp", ".png"))]
    files += ["img/blog/" + f for f in imgs]
    git("add", *files)
    msg = "Publica artículo programado: %s\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" % slug
    git("commit", "-m", msg)
    git("push", "origin", "main")

    print("Publicado:", slug, "(imagenes: %d)" % len(imgs))
    if not imgs:
        print("AVISO: no hay imagenes img/blog/%s*.jpg; se vera el marcador de posicion." % slug)


if __name__ == "__main__":
    main()
