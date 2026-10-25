#!/usr/bin/env python3
"""Builds legal/index.html: aviso legal, privacy policy and storage notice (Spanish, the binding version).
Edit the holder data below and rerun. Linked from the landing footer, the waiting-list form and the app settings."""
import html, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
# Holder: a private person while the project earns nothing; switch to autónomo data (NIF, address) when it starts charging.
TITULAR = 'Peru Alaña Zubeldia'
EMAIL = 'hola@etxeberriai.com'
UPDATED = '25 de octubre de 2026'

CSS = (ROOT / 'tools/landing.css').read_text()
CSP = ("default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self'; "
       "base-uri 'none'; form-action 'none'; object-src 'none'")
NOTE = {  # Shown on top for visitors who read the site in another language.
    'eu': 'Testu hau gaztelaniaz dago, legez balio duen bertsioa delako. Zalantzarik baduzu, idatzi iezaguzu.',
    'en': 'This text is in Spanish, the legally binding version. If you have any question, write to us.',
    'ca': 'Aquest text és en castellà, que és la versió amb validesa legal. Si tens cap dubte, escriu-nos.',
    'fr': "Ce texte est en espagnol, la version juridiquement applicable. Pour toute question, écrivez-nous.",
}

t, e = html.escape(TITULAR), html.escape(EMAIL)
mail = f'<a href="mailto:{e}">{e}</a>'
notes = ''.join(f'<p lang="{l}" class="note">{html.escape(n)}</p>' for l, n in NOTE.items())

page = f'''<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="{CSP}">
<title>Aviso legal y privacidad · EtxeBerriAI</title>
<meta name="description" content="Quién está detrás de EtxeBerriAI, qué datos tratamos, para qué y cómo ejercer tus derechos.">
<link rel="canonical" href="https://etxeberriai.com/legal/">
<link rel="icon" href="../icon.svg" type="image/svg+xml">
<meta name="theme-color" content="#335c49">
<link rel="stylesheet" href="../fonts/fonts.css">
<style>{CSS}
.doc{{max-width:760px;padding-top:32px;padding-bottom:48px}}
.doc h1{{font-size:clamp(1.8rem,4vw,2.4rem)}}
.doc h2{{font-size:1.45rem;margin:40px 0 8px;scroll-margin-top:76px}}
.doc h3{{margin:22px 0 4px}}
.doc p,.doc li{{color:var(--fg)}}
.doc .muted,.note{{color:var(--muted);font-size:.9rem}}
.note{{margin:4px 0}}
.toc{{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0;padding:0;list-style:none}}
.toc a{{display:inline-block;padding:6px 12px;border:1px solid var(--line);border-radius:99px;text-decoration:none;font-size:.9rem;background:var(--panel)}}
.tbl{{overflow-x:auto;margin:12px 0}}
table{{border-collapse:collapse;width:100%;min-width:560px;font-size:.92rem}}
th,td{{text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid var(--line)}}
th{{font-family:var(--f-display);background:var(--soft)}}
@media (max-width:640px){{table{{min-width:0}} table,tbody,tr,td{{display:block}} tr:first-child{{display:none}}
  tr{{border:1px solid var(--line);border-radius:12px;padding:4px 12px;margin-bottom:10px;background:var(--panel)}}
  td{{padding:8px 0}} td+td{{border-top:1px solid var(--line)}} td:last-child{{border-bottom:0}}
  td[data-l]::before{{content:attr(data-l);display:block;font:600 .78rem var(--f-display);color:var(--muted);text-transform:uppercase;letter-spacing:.05em}}}}
</style></head><body>
<header><div class="wrap">
  <a class="logo" href="../"><img src="../icon.svg" alt="">EtxeBerriAI</a>
  <nav><a class="btn" href="../app/">Abrir la app</a></nav>
</div></header>
<main class="wrap doc">
  <h1>Aviso legal y privacidad</h1>
  <p class="muted">Última actualización: {UPDATED}.</p>
  {notes}
  <ul class="toc"><li><a href="#aviso">Aviso legal</a></li><li><a href="#uso">Condiciones de uso</a></li><li><a href="#privacidad">Privacidad</a></li><li><a href="#almacenamiento">Cookies y almacenamiento</a></li></ul>

  <h2 id="aviso">Aviso legal</h2>
  <p>EtxeBerriAI (etxeberriai.com) es un proyecto personal de <b>{t}</b>, que lo ofrece como particular y sin actividad comercial mientras dura la fase de pruebas. Puedes escribirnos a {mail}.</p>
  <p>Cuando EtxeBerriAI empiece a cobrar, actualizaremos este aviso con los datos fiscales del titular.</p>

  <h2 id="uso">Condiciones de uso</h2>
  <h3>Qué es</h3>
  <p>EtxeBerriAI genera con inteligencia artificial propuestas de reforma a partir de fotos de tu casa: imágenes, vídeos, un plano 3D, un diseño editable y una lista de compra con precios orientativos. Ahora está en fase de pruebas, gratuita y con códigos de acceso personales.</p>
  <h3>Imágenes generadas con IA</h3>
  <p>Las imágenes y vídeos de propuesta están generados con IA y van marcados como tales. Son orientativos: sirven para imaginar y decidir, no son un proyecto técnico ni sustituyen a un arquitecto, aparejador o reformista. Los precios, medidas y disponibilidad de los productos son de referencia y pueden cambiar; compruébalos en la tienda antes de comprar.</p>
  <h3>Uso correcto</h3>
  <ul>
    <li>Sube solo fotos que hayas hecho tú o que tengas derecho a usar, y evita que aparezcan personas.</li>
    <li>No uses la app para crear contenido ilegal, engañoso u ofensivo.</li>
    <li>Tu código de acceso es personal. Si vemos un uso abusivo, podemos desactivarlo.</li>
  </ul>
  <h3>Propiedad</h3>
  <p>Tus fotos son tuyas, y puedes usar libremente las imágenes que generes con ellas. La marca EtxeBerriAI, el diseño de la web y su código pertenecen al titular.</p>
  <h3>Enlaces a tiendas</h3>
  <p>La lista de compra enlaza a tiendas de terceros, que tienen sus propias condiciones. Algunos enlaces pueden ser de afiliado: si compras a través de ellos, recibimos una pequeña comisión sin que a ti te cueste más.</p>
  <h3>Responsabilidad y ley aplicable</h3>
  <p>Ponemos cuidado en que el servicio funcione bien, pero en esta fase de pruebas puede fallar o cambiar. No respondemos de decisiones de obra o de compra tomadas solo a partir de las propuestas. Se aplica la ley española; si eres consumidor, son competentes los juzgados de tu domicilio.</p>

  <h2 id="privacidad">Privacidad</h2>
  <p>Tratamos los mínimos datos posibles. No vendemos datos, no hacemos publicidad ni perfiles, y no usamos analítica.</p>
  <h3>Responsable</h3>
  <p>{t}. Contacto: {mail}.</p>
  <h3>Qué datos tratamos y para qué</h3>
  <div class="tbl"><table>
    <tr><th>Qué</th><th>Para qué</th><th>Base legal</th><th>Cuánto tiempo</th></tr>
    <tr><td><b>Lista de espera</b>: tu email, quién eres (particular, profesional…), el idioma de la página y la fecha.</td><td data-l="Para qué">Avisarte del lanzamiento.</td><td data-l="Base legal">Tu consentimiento, que puedes retirar cuando quieras.</td><td data-l="Cuánto tiempo">Hasta que pidas la baja, y como mucho 2 años.</td></tr>
    <tr><td><b>Código de acceso</b>: una huella cifrada del código (no el código en sí), el nombre con el que te lo dimos y tus créditos.</td><td data-l="Para qué">Darte acceso y descontar créditos al generar.</td><td data-l="Base legal">Prestarte el servicio que pides.</td><td data-l="Cuánto tiempo">Mientras el código esté activo.</td></tr>
    <tr><td><b>Fotos e indicaciones al generar</b>: la foto de la estancia y lo que pides.</td><td data-l="Para qué">Generar la propuesta con la IA de Google (Gemini).</td><td data-l="Base legal">Prestarte el servicio que pides.</td><td data-l="Cuánto tiempo">Nuestro servidor no las guarda. Google las trata según las condiciones de su API de pago, que no las usa para entrenar sus modelos y puede conservarlas un tiempo limitado para detectar abusos.</td></tr>
    <tr><td><b>Datos técnicos</b>: dirección IP y datos del navegador al visitar la web o usar el servidor.</td><td data-l="Para qué">Servir la web y protegerla de ataques.</td><td data-l="Base legal">Interés legítimo en que el servicio funcione y sea seguro.</td><td data-l="Cuánto tiempo">Los registros temporales de nuestros proveedores.</td></tr>
  </table></div>
  <p><b>Tus proyectos se guardan en tu dispositivo.</b> Fotos, diseños, listas y ajustes viven en el almacenamiento de tu navegador; nosotros no tenemos acceso a ellos. Se borran con «Empezar de cero» en los Ajustes de la app o borrando los datos del sitio en el navegador.</p>
  <p>Si usas tu propia clave de Google Gemini en lugar de un código de acceso, las fotos van directamente de tu navegador a Google, bajo tus propias condiciones con Google.</p>
  <h3>Proveedores</h3>
  <ul>
    <li><b>Cloudflare, Inc.</b>: dominio, servidor que conecta con la IA y guarda la lista de espera y los códigos.</li>
    <li><b>Google</b>: IA que genera las imágenes, vídeos y textos (API de Gemini).</li>
    <li><b>GitHub, Inc.</b>: alojamiento de la web.</li>
  </ul>
  <p>Son proveedores de Estados Unidos. Las transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. y en las cláusulas contractuales tipo de la Comisión Europea.</p>
  <h3>Tus derechos</h3>
  <p>Puedes pedirnos acceder a tus datos, corregirlos, borrarlos, limitar su uso, oponerte, llevártelos o retirar tu consentimiento, escribiendo a {mail}. Si crees que no los tratamos bien, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es">aepd.es</a>).</p>
  <h3>Menores</h3>
  <p>EtxeBerriAI no está pensado para menores de 14 años.</p>

  <h2 id="almacenamiento">Cookies y almacenamiento</h2>
  <p>No usamos cookies de publicidad ni de analítica, ni de terceros. La web y la app solo guardan en tu navegador lo necesario para funcionar: el idioma, los ajustes, tu código de acceso y tu proyecto. Al ser estrictamente necesario para el servicio que pides, no requiere consentimiento (artículo 22.2 de la LSSI). Las fuentes tipográficas se sirven desde nuestra propia web, sin conectar con Google.</p>

  <h2>Cambios</h2>
  <p>Si cambiamos algo importante, lo indicaremos aquí con la nueva fecha y, si estás en la lista de espera, te avisaremos por email.</p>
</main>
<footer><div class="wrap">EtxeBerriAI · <a href="../">Inicio</a> · {mail}</div></footer>
</body></html>
'''

out = ROOT / 'legal/index.html'
out.parent.mkdir(exist_ok=True)
out.write_text(page)
print('legal built')
