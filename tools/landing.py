#!/usr/bin/env python3
"""Builds the landing page in each language: index.html (es) and eu/, en/, ca/, fr/ index.html.
Edit the texts in T, then run: python3 tools/landing.py"""
import html, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://etxeberriai.com'
API = 'https://api.etxeberriai.com'  # Server (Cloudflare Worker)
LANGS = ['es', 'eu', 'en', 'ca', 'fr']
NAMES = {'es': 'Castellano', 'eu': 'Euskara', 'en': 'English', 'ca': 'Català', 'fr': 'Français'}

T = {
 'es': dict(
  title='EtxeBerriAI · Mira cómo quedará tu casa antes de reformarla',
  desc='Haz una foto de cada estancia y EtxeBerriAI te enseña la reforma realista, con los productos para comprarla y lo que cuesta.',
  og='Fotos realistas de tu reforma con IA, plano 3D de tu casa y lista de compra con precios.',
  tagline='«Etxe berri» significa «casa nueva» en euskera.',
  nav_how='Cómo funciona', nav_price='Precios', nav_join='Apúntate',
  h1='Mira cómo quedará tu casa antes de reformarla.',
  lead='Haz una foto de cada estancia y EtxeBerriAI te enseña la reforma con fotos realistas, junto con los productos para hacerla y lo que cuesta.',
  cta_join='Apúntate a la lista de espera', cta_try='Probar la app',
  demo_title='Demo: plano 3D de una casa real, estado actual y propuesta',
  demo_note='Demo real, la primera planta de una casa del valle. Pulsa «Propuesta» para ver la reforma y gira el modelo con el dedo.',
  how_h='De la foto a la lista de la compra en tres pasos', step='Paso',
  s1h='Fotos o plano', s1='Haz fotos de la estancia desde las esquinas o sube el boceto de la planta. Sin medir nada.',
  s2h='Propuesta realista', s2='La IA mantiene tu casa, tu luz y lo que quieras conservar, y cambia solo lo que eliges: pintura, suelo, muebles, luz.',
  s3h='Compra y presupuesto', s3='Cada cambio viene con productos reales de Leroy Merlin, IKEA y otras tiendas, el precio total y un informe en PDF.',
  who_h='Para quien reforma y para quien vende reformas',
  w1h='Particulares', w1='Decidid en pareja antes de gastar un euro. Comparad versiones y llevad al reformista una lista cerrada.',
  w2h='Reformistas e interioristas', w2='Enseña al cliente cómo quedará en la primera visita y entrega un PDF con tu logotipo, el antes y el después y el presupuesto de materiales.',
  w3h='Inmobiliarias', w3='Muestra el potencial de un piso para reformar y vende antes, sin obras ni home staging físico.',
  pr_h='Precios sencillos, sin permanencia', pr_lead='Pagas solo cuando lo usas. Los precios son de lanzamiento para la lista de espera.',
  p0='Prueba', p0s='para siempre', p0l=['3 fotos reformadas', 'Plano 3D', 'Lista de compra'],
  p1='Estancia', p1s='pago único', p1l=['30 fotos', 'Para una o dos estancias'],
  p2='Casa', p2s='pago único', p2l=['80 fotos', '2 vídeos antes y después', 'Informe PDF'],
  p3='Profesional', p3s='al mes + IVA', p3l=['300 fotos al mes', 'Clientes ilimitados', 'PDF con tu logotipo'],
  wl_h='Apúntate y te avisamos el día del lanzamiento', wl_lead='Los primeros de la lista tendrán fotos extra gratis.',
  email_ph='tu@email.com', who_label='Quién eres',
  o1='Voy a reformar mi casa', o2='Soy reformista o interiorista', o3='Trabajo en una inmobiliaria', o4='Otro',
  consent='Acepto que EtxeBerriAI guarde mi email solo para avisarme del lanzamiento. Puedo pedir que lo borren cuando quiera.',
  send='Apuntarme',
  faq_h='Preguntas frecuentes',
  q1='¿Necesito saber de diseño?', a1='No. Eliges un estilo y cuánto quieres cambiar, y la IA propone el resto. Puedes activar o quitar cada cambio.',
  q2='¿Las fotos son reales?', a2='Son imágenes generadas con inteligencia artificial a partir de tus fotos y van marcadas como tales. Son orientativas: sirven para decidir, no son un proyecto técnico.',
  q3='¿Qué pasa con las fotos de mi casa?', a3='Tus proyectos se guardan en tu móvil. Para generar cada propuesta, la foto se envía a la IA de Google (Gemini) en su modalidad de pago, que no usa tus datos para entrenar.',
  q4='¿Los precios de los productos son fiables?', a4='Son precios de referencia de cada tienda. Algunos enlaces de compra son de afiliado: si compras por ellos, recibimos una pequeña comisión sin coste para ti.',
  q5='¿En qué idiomas está?', a5='La web está en castellano, euskera, inglés, catalán y francés. La app, de momento, en castellano; los demás idiomas llegan con el lanzamiento.',
  foot='EtxeBerriAI · Reforma con IA. Imágenes de propuesta generadas con inteligencia artificial, orientativas.',
  m_email='Revisa el email, parece que falta algo.', m_consent='Marca la casilla para poder guardarte en la lista.',
  m_soon='La lista se abre en unos días. Mientras tanto puedes probar la app.', m_saving='Guardando...',
  m_ok='¡Apuntado! Te avisaremos el día del lanzamiento.', m_err='No se pudo guardar. Inténtalo de nuevo.', lang_label='Idioma'),
 'eu': dict(
  title='EtxeBerriAI · Ikusi zure etxea nola geratuko den berritu aurretik',
  desc='Atera argazki bat gela bakoitzari eta EtxeBerriAIk berrikuntza errealista erakutsiko dizu, erosi beharreko produktuekin eta zenbat kostatzen den.',
  og='Zure berrikuntzaren argazki errealistak AArekin, etxearen 3D planoa eta prezioak dituen erosketa-zerrenda.',
  tagline='«Etxe berri»: zure etxea, berritua.',
  nav_how='Nola dabil', nav_price='Prezioak', nav_join='Izena eman',
  h1='Ikusi zure etxea nola geratuko den berritu aurretik.',
  lead='Atera argazki bat gela bakoitzari eta EtxeBerriAIk berrikuntza erakutsiko dizu argazki errealistetan, egiteko behar diren produktuekin eta zenbat kostatzen den.',
  cta_join='Eman izena itxaron-zerrendan', cta_try='Probatu aplikazioa',
  demo_title='Demoa: benetako etxe baten 3D planoa, gaur egungo egoera eta proposamena',
  demo_note='Benetako demoa: haraneko etxe baten lehen solairua. Sakatu «Propuesta» berrikuntza ikusteko eta biratu eredua hatzarekin.',
  how_h='Argazkitik erosketa-zerrendara hiru urratsetan', step='Urratsa',
  s1h='Argazkiak edo planoa', s1='Atera gelaren argazkiak izkinetatik edo igo solairuaren zirriborroa. Ezer neurtu gabe.',
  s2h='Proposamen errealista', s2='AAk zure etxea, argia eta gorde nahi duzuna mantentzen ditu, eta zuk aukeratutakoa bakarrik aldatzen du: pintura, zorua, altzariak, argiak.',
  s3h='Erosketa eta aurrekontua', s3='Aldaketa bakoitzak Leroy Merlin, IKEA eta beste denda batzuetako benetako produktuak dakartza, prezio osoa eta PDF txosten bat.',
  who_h='Berritzen dutenentzat eta berrikuntzak saltzen dituztenentzat',
  w1h='Partikularrak', w1='Erabaki bikotean euro bat gastatu aurretik. Konparatu bertsioak eta eraman zerrenda itxi bat obra-egileari.',
  w2h='Obra-egileak eta barnealdeko diseinatzaileak', w2='Erakutsi bezeroari nola geratuko den lehen bisitan eta eman PDF bat zure logoarekin, aurretik eta ondoren, eta materialen aurrekontuarekin.',
  w3h='Higiezinen agentziak', w3='Erakutsi berritzeko dagoen etxebizitza baten aukerak eta saldu lehenago, obrarik eta home staging fisikorik gabe.',
  pr_h='Prezio errazak, iraupen-konpromisorik gabe', pr_lead='Erabiltzen duzunean bakarrik ordaintzen duzu. Itxaron-zerrendarako abiarazte-prezioak dira.',
  p0='Proba', p0s='betiko', p0l=['3 argazki berrituta', '3D planoa', 'Erosketa-zerrenda'],
  p1='Gela', p1s='ordainketa bakarra', p1l=['30 argazki', 'Gela bat edo birentzat'],
  p2='Etxea', p2s='ordainketa bakarra', p2l=['80 argazki', 'Aurretik eta ondoren 2 bideo', 'PDF txostena'],
  p3='Profesionala', p3s='hilean + BEZ', p3l=['300 argazki hilean', 'Bezero mugagabeak', 'PDFa zure logoarekin'],
  wl_h='Eman izena eta abiarazte-egunean abisatuko dizugu', wl_lead='Zerrendako lehenek argazki gehigarriak izango dituzte doan.',
  email_ph='zu@email.eus', who_label='Nor zara',
  o1='Nire etxea berrituko dut', o2='Obra-egilea edo diseinatzailea naiz', o3='Higiezinen agentzian lan egiten dut', o4='Beste bat',
  consent='Onartzen dut EtxeBerriAIk nire emaila gordetzea abiarazteaz abisatzeko soilik. Nahi dudanean ezabatzeko eska dezaket.',
  send='Izena eman',
  faq_h='Ohiko galderak',
  q1='Diseinuaz jakin behar dut?', a1='Ez. Estilo bat eta zenbat aldatu nahi duzun aukeratzen dituzu, eta gainerakoa AAk proposatzen du. Aldaketa bakoitza aktibatu edo kendu dezakezu.',
  q2='Argazkiak benetakoak dira?', a2='Zure argazkietatik adimen artifizialarekin sortutako irudiak dira, eta hala markatuta daude. Orientagarriak dira: erabakitzeko balio dute, ez dira proiektu teknikoa.',
  q3='Zer gertatzen da nire etxeko argazkiekin?', a3='Zure proiektuak zure mugikorrean gordetzen dira. Proposamen bakoitza sortzeko, argazkia Googleren AAra (Gemini) bidaltzen da ordainpeko moduan, eta horrek ez ditu zure datuak entrenatzeko erabiltzen.',
  q4='Produktuen prezioak fidagarriak dira?', a4='Denda bakoitzeko erreferentziazko prezioak dira. Erosteko esteka batzuk afiliatuak dira: haietatik erosten baduzu, komisio txiki bat jasotzen dugu, zuretzat kosturik gabe.',
  q5='Zein hizkuntzatan dago?', a5='Webgunea gaztelaniaz, euskaraz, ingelesez, katalanez eta frantsesez dago. Aplikazioa, oraingoz, gaztelaniaz; beste hizkuntzak abiaraztearekin batera iritsiko dira.',
  foot='EtxeBerriAI · Berrikuntza AArekin. Proposamenen irudiak adimen artifizialarekin sortuak dira, orientagarriak.',
  m_email='Begiratu emaila, zerbait falta dela dirudi.', m_consent='Markatu laukia zerrendan gorde ahal izateko.',
  m_soon='Zerrenda egun gutxi barru irekiko da. Bitartean, aplikazioa proba dezakezu.', m_saving='Gordetzen...',
  m_ok='Izena emanda! Abiarazte-egunean abisatuko dizugu.', m_err='Ezin izan da gorde. Saiatu berriro.', lang_label='Hizkuntza'),
 'en': dict(
  title='EtxeBerriAI · See your home renovated before you start',
  desc='Take a photo of each room and EtxeBerriAI shows you a realistic renovation, with the products to buy and what it costs.',
  og='Realistic AI photos of your renovation, a 3D floor plan of your home and a shopping list with prices.',
  tagline='“Etxe berri” means “new home” in Basque.',
  nav_how='How it works', nav_price='Pricing', nav_join='Join',
  h1='See how your home will look before you renovate.',
  lead='Take a photo of each room and EtxeBerriAI shows you the renovation in realistic photos, together with the products to do it and what it costs.',
  cta_join='Join the waiting list', cta_try='Try the app',
  demo_title='Demo: 3D floor plan of a real house, current state and proposal',
  demo_note='Real demo: the ground floor of a house in the valley. Tap «Propuesta» to see the renovation and turn the model with your finger.',
  how_h='From photo to shopping list in three steps', step='Step',
  s1h='Photos or floor plan', s1='Take photos of the room from the corners or upload a sketch of the floor. No measuring needed.',
  s2h='A realistic proposal', s2='The AI keeps your home, your light and whatever you want to keep, and changes only what you choose: paint, floors, furniture, lighting.',
  s3h='Shopping list and budget', s3='Every change comes with real products from Leroy Merlin, IKEA and other shops, the total price and a PDF report.',
  who_h='For people who renovate and people who sell renovations',
  w1h='Homeowners', w1='Decide together before spending a euro. Compare versions and give your builder a final list.',
  w2h='Builders and interior designers', w2='Show clients how it will look on the first visit and hand over a PDF with your logo, the before and after and the materials budget.',
  w3h='Estate agents', w3='Show the potential of a property that needs work and sell faster, without works or physical home staging.',
  pr_h='Simple pricing, no commitment', pr_lead='You only pay when you use it. Launch prices for the waiting list.',
  p0='Trial', p0s='forever', p0l=['3 renovated photos', '3D floor plan', 'Shopping list'],
  p1='Room', p1s='one-off payment', p1l=['30 photos', 'For one or two rooms'],
  p2='Home', p2s='one-off payment', p2l=['80 photos', '2 before-and-after videos', 'PDF report'],
  p3='Professional', p3s='per month + VAT', p3l=['300 photos a month', 'Unlimited clients', 'PDF with your logo'],
  wl_h='Join and we will let you know on launch day', wl_lead='The first people on the list get extra photos for free.',
  email_ph='you@email.com', who_label='Who you are',
  o1='I am renovating my home', o2='I am a builder or interior designer', o3='I work at an estate agency', o4='Other',
  consent='I agree that EtxeBerriAI stores my email only to tell me about the launch. I can ask for it to be deleted at any time.',
  send='Sign me up',
  faq_h='Frequently asked questions',
  q1='Do I need to know about design?', a1='No. You pick a style and how much you want to change, and the AI suggests the rest. You can switch each change on or off.',
  q2='Are the photos real?', a2='They are images generated with artificial intelligence from your photos and are labelled as such. They are a guide to help you decide, not a technical project.',
  q3='What happens to the photos of my home?', a3='Your projects are stored on your phone. To create each proposal, the photo is sent to Google’s AI (Gemini) on its paid tier, which does not use your data for training.',
  q4='Are product prices reliable?', a4='They are each shop’s reference prices. Some shopping links are affiliate links: if you buy through them we receive a small commission at no cost to you.',
  q5='Which languages is it in?', a5='The website is in Spanish, Basque, English, Catalan and French. The app is in Spanish for now; the other languages arrive with the launch.',
  foot='EtxeBerriAI · Renovation with AI. Proposal images are generated with artificial intelligence and are for guidance only.',
  m_email='Check your email address, something seems to be missing.', m_consent='Tick the box so we can add you to the list.',
  m_soon='The list opens in a few days. Meanwhile you can try the app.', m_saving='Saving...',
  m_ok='You are on the list! We will let you know on launch day.', m_err='Could not save. Please try again.', lang_label='Language'),
 'ca': dict(
  title='EtxeBerriAI · Mira com quedarà casa teva abans de reformar-la',
  desc="Fes una foto de cada estança i EtxeBerriAI t'ensenya la reforma realista, amb els productes per comprar-la i el que costa.",
  og='Fotos realistes de la teva reforma amb IA, pla 3D de casa teva i llista de la compra amb preus.',
  tagline='«Etxe berri» vol dir «casa nova» en basc.',
  nav_how='Com funciona', nav_price='Preus', nav_join="Apunta't",
  h1='Mira com quedarà casa teva abans de reformar-la.',
  lead="Fes una foto de cada estança i EtxeBerriAI t'ensenya la reforma amb fotos realistes, juntament amb els productes per fer-la i el que costa.",
  cta_join="Apunta't a la llista d'espera", cta_try="Prova l'app",
  demo_title="Demo: pla 3D d'una casa real, estat actual i proposta",
  demo_note="Demo real: la primera planta d'una casa de la vall. Prem «Propuesta» per veure la reforma i gira el model amb el dit.",
  how_h='De la foto a la llista de la compra en tres passos', step='Pas',
  s1h='Fotos o pla', s1="Fes fotos de l'estança des de les cantonades o puja l'esbós de la planta. Sense mesurar res.",
  s2h='Proposta realista', s2='La IA manté casa teva, la teva llum i el que vulguis conservar, i canvia només el que tries: pintura, terra, mobles, llum.',
  s3h='Compra i pressupost', s3="Cada canvi ve amb productes reals de Leroy Merlin, IKEA i altres botigues, el preu total i un informe en PDF.",
  who_h='Per a qui reforma i per a qui ven reformes',
  w1h='Particulars', w1="Decidiu en parella abans de gastar un euro. Compareu versions i porteu al paleta una llista tancada.",
  w2h='Paletes i interioristes', w2="Ensenya al client com quedarà a la primera visita i lliura un PDF amb el teu logotip, l'abans i el després i el pressupost de materials.",
  w3h='Immobiliàries', w3="Mostra el potencial d'un pis per reformar i ven abans, sense obres ni home staging físic.",
  pr_h='Preus senzills, sense permanència', pr_lead="Pagues només quan ho fas servir. Són preus de llançament per a la llista d'espera.",
  p0='Prova', p0s='per sempre', p0l=['3 fotos reformades', 'Pla 3D', 'Llista de la compra'],
  p1='Estança', p1s='pagament únic', p1l=['30 fotos', 'Per a una o dues estances'],
  p2='Casa', p2s='pagament únic', p2l=['80 fotos', '2 vídeos abans i després', 'Informe PDF'],
  p3='Professional', p3s='al mes + IVA', p3l=['300 fotos al mes', 'Clients il·limitats', 'PDF amb el teu logotip'],
  wl_h="Apunta't i t'avisarem el dia del llançament", wl_lead='Els primers de la llista tindran fotos extra gratis.',
  email_ph='tu@email.cat', who_label='Qui ets',
  o1='Reformaré casa meva', o2='Soc paleta o interiorista', o3='Treballo en una immobiliària', o4='Altres',
  consent="Accepto que EtxeBerriAI guardi el meu email només per avisar-me del llançament. Puc demanar que l'esborrin quan vulgui.",
  send="Apunta'm",
  faq_h='Preguntes freqüents',
  q1="Cal saber de disseny?", a1="No. Tries un estil i quant vols canviar, i la IA proposa la resta. Pots activar o treure cada canvi.",
  q2='Les fotos són reals?', a2="Són imatges generades amb intel·ligència artificial a partir de les teves fotos i van marcades com a tals. Són orientatives: serveixen per decidir, no són un projecte tècnic.",
  q3='Què passa amb les fotos de casa meva?', a3="Els teus projectes es guarden al mòbil. Per generar cada proposta, la foto s'envia a la IA de Google (Gemini) en la modalitat de pagament, que no fa servir les teves dades per entrenar.",
  q4='Els preus dels productes són fiables?', a4="Són preus de referència de cada botiga. Alguns enllaços de compra són d'afiliat: si compres a través d'ells, rebem una petita comissió sense cost per a tu.",
  q5='En quins idiomes està?', a5="El web està en castellà, basc, anglès, català i francès. L'app, de moment, en castellà; els altres idiomes arribaran amb el llançament.",
  foot='EtxeBerriAI · Reforma amb IA. Imatges de proposta generades amb intel·ligència artificial, orientatives.',
  m_email="Revisa l'email, sembla que hi falta alguna cosa.", m_consent='Marca la casella per poder guardar-te a la llista.',
  m_soon="La llista s'obre d'aquí a uns dies. Mentrestant pots provar l'app.", m_saving='Desant...',
  m_ok="Apuntat! T'avisarem el dia del llançament.", m_err="No s'ha pogut desar. Torna-ho a provar.", lang_label='Idioma'),
 'fr': dict(
  title='EtxeBerriAI · Voyez votre maison rénovée avant les travaux',
  desc='Prenez une photo de chaque pièce et EtxeBerriAI vous montre une rénovation réaliste, avec les produits à acheter et le coût.',
  og="Photos réalistes de votre rénovation grâce à l'IA, plan 3D de votre maison et liste d'achats avec les prix.",
  tagline='« Etxe berri » signifie « maison neuve » en basque.',
  nav_how='Comment ça marche', nav_price='Tarifs', nav_join="S'inscrire",
  h1='Voyez à quoi ressemblera votre maison avant de la rénover.',
  lead="Prenez une photo de chaque pièce et EtxeBerriAI vous montre la rénovation en photos réalistes, avec les produits pour la réaliser et ce qu'elle coûte.",
  cta_join="Rejoindre la liste d'attente", cta_try="Essayer l'appli",
  demo_title="Démo : plan 3D d'une vraie maison, état actuel et proposition",
  demo_note="Démo réelle : le rez-de-chaussée d'une maison de la vallée. Touchez « Propuesta » pour voir la rénovation et faites tourner le modèle du doigt.",
  how_h="De la photo à la liste d'achats en trois étapes", step='Étape',
  s1h='Photos ou plan', s1='Photographiez la pièce depuis les angles ou importez le croquis du plan. Sans rien mesurer.',
  s2h='Une proposition réaliste', s2="L'IA garde votre maison, votre lumière et ce que vous voulez conserver, et ne change que ce que vous choisissez : peinture, sol, meubles, éclairage.",
  s3h='Achats et budget', s3="Chaque changement est accompagné de vrais produits de Leroy Merlin, IKEA et d'autres magasins, du prix total et d'un rapport PDF.",
  who_h='Pour ceux qui rénovent et ceux qui vendent des rénovations',
  w1h='Particuliers', w1="Décidez à deux avant de dépenser un euro. Comparez les versions et remettez à l'artisan une liste définitive.",
  w2h='Artisans et architectes d’intérieur', w2="Montrez au client le résultat dès la première visite et remettez un PDF à votre logo, avec l'avant, l'après et le budget des matériaux.",
  w3h='Agences immobilières', w3='Montrez le potentiel d’un bien à rénover et vendez plus vite, sans travaux ni home staging physique.',
  pr_h='Des tarifs simples, sans engagement', pr_lead="Vous ne payez que lorsque vous l'utilisez. Tarifs de lancement pour la liste d'attente.",
  p0='Essai', p0s='pour toujours', p0l=['3 photos rénovées', 'Plan 3D', "Liste d'achats"],
  p1='Pièce', p1s='paiement unique', p1l=['30 photos', 'Pour une ou deux pièces'],
  p2='Maison', p2s='paiement unique', p2l=['80 photos', '2 vidéos avant/après', 'Rapport PDF'],
  p3='Professionnel', p3s='par mois HT', p3l=['300 photos par mois', 'Clients illimités', 'PDF à votre logo'],
  wl_h='Inscrivez-vous, nous vous préviendrons le jour du lancement', wl_lead='Les premiers inscrits recevront des photos supplémentaires gratuites.',
  email_ph='vous@email.fr', who_label='Qui êtes-vous',
  o1='Je vais rénover ma maison', o2="Je suis artisan ou architecte d'intérieur", o3='Je travaille dans une agence immobilière', o4='Autre',
  consent="J'accepte qu'EtxeBerriAI conserve mon e-mail uniquement pour me prévenir du lancement. Je peux demander sa suppression à tout moment.",
  send="M'inscrire",
  faq_h='Questions fréquentes',
  q1='Faut-il s’y connaître en décoration ?', a1="Non. Vous choisissez un style et l'ampleur des changements, l'IA propose le reste. Vous pouvez activer ou retirer chaque changement.",
  q2='Les photos sont-elles réelles ?', a2="Ce sont des images générées par intelligence artificielle à partir de vos photos, signalées comme telles. Elles sont indicatives : elles aident à décider, ce n'est pas un projet technique.",
  q3='Que deviennent les photos de ma maison ?', a3="Vos projets sont enregistrés sur votre téléphone. Pour créer chaque proposition, la photo est envoyée à l'IA de Google (Gemini) en formule payante, qui n'utilise pas vos données pour l'entraînement.",
  q4='Les prix des produits sont-ils fiables ?', a4="Ce sont les prix de référence de chaque magasin. Certains liens d'achat sont affiliés : si vous achetez par leur biais, nous touchons une petite commission sans frais pour vous.",
  q5='En quelles langues est-elle disponible ?', a5="Le site est en espagnol, basque, anglais, catalan et français. L'appli est pour l'instant en espagnol ; les autres langues arrivent avec le lancement.",
  foot="EtxeBerriAI · Rénovation avec l'IA. Images de proposition générées par intelligence artificielle, à titre indicatif.",
  m_email="Vérifiez l'e-mail, il semble manquer quelque chose.", m_consent='Cochez la case pour que nous puissions vous inscrire.',
  m_soon="La liste ouvre dans quelques jours. En attendant, vous pouvez essayer l'appli.", m_saving='Enregistrement...',
  m_ok='Inscrit ! Nous vous préviendrons le jour du lancement.', m_err="L'enregistrement a échoué. Réessayez.", lang_label='Langue'),
}

CSS = (ROOT / 'tools/landing.css').read_text()
CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
       "font-src https://fonts.gstatic.com; img-src 'self' data:; frame-src 'self'; connect-src 'self' https://*.workers.dev https://*.etxeberriai.com; "
       "base-uri 'none'; form-action 'none'; object-src 'none'")


def page(lang):
    t = {k: (v if isinstance(v, list) else html.escape(v, quote=True)) for k, v in T[lang].items()}
    root = '' if lang == 'es' else '../'
    here = SITE + '/' + ('' if lang == 'es' else lang + '/')
    alt = ''.join(f'<link rel="alternate" hreflang="{l}" href="{SITE}/{"" if l == "es" else l + "/"}">' for l in LANGS)
    alt += f'<link rel="alternate" hreflang="x-default" href="{SITE}/">'
    opts = ''.join(f'<option value="{l}"{" selected" if l == lang else ""}>{NAMES[l]}</option>' for l in LANGS)
    li = lambda xs: ''.join(f'<li>{html.escape(x)}</li>' for x in xs)
    msgs = json.dumps({k[2:]: T[lang][k] for k in T[lang] if k.startswith('m_')}, ensure_ascii=False)
    return f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="{CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>{t['title']}</title>
<meta name="description" content="{t['desc']}">
<link rel="canonical" href="{here}">{alt}
<meta property="og:title" content="{t['title']}">
<meta property="og:description" content="{t['og']}">
<meta property="og:url" content="{here}"><meta property="og:image" content="{SITE}/icon-512.png">
<link rel="icon" href="{root}icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="{root}icon-180.png">
<meta name="theme-color" content="#335c49">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>{CSS}
.lang{{font:.88rem var(--f-body);padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--panel);color:var(--fg);min-width:0;flex:none}}
.tagline{{font-size:.9rem;color:var(--muted);margin:10px 0 0}}
</style></head><body>
<header><div class="wrap">
  <a class="logo" href="./"><img src="{root}icon.svg" alt="">EtxeBerriAI</a>
  <nav><a class="hide" href="#como">{t['nav_how']}</a><a class="hide" href="#precios">{t['nav_price']}</a>
  <select class="lang" id="lang" aria-label="{t['lang_label']}">{opts}</select><a class="btn pri" href="#lista">{t['nav_join']}</a></nav>
</div></header>
<main>
  <div class="wrap hero">
    <div>
      <h1>{t['h1']}</h1>
      <p class="lead">{t['lead']}</p>
      <div class="ctas"><a class="btn pri" href="#lista">{t['cta_join']}</a><a class="btn" href="{root}app/">{t['cta_try']}</a></div>
      <p class="tagline">{t['tagline']}</p>
    </div>
    <figure class="demo" style="margin:0">
      <iframe src="{root}plano3d/?demo" title="{t['demo_title']}" loading="lazy"></iframe>
      <p>{t['demo_note']}</p>
    </figure>
  </div>

  <section id="como"><div class="wrap">
    <h2>{t['how_h']}</h2>
    <div class="grid3">
      <div class="card"><div class="num">{t['step']} 1</div><h3>{t['s1h']}</h3><p>{t['s1']}</p></div>
      <div class="card"><div class="num">{t['step']} 2</div><h3>{t['s2h']}</h3><p>{t['s2']}</p></div>
      <div class="card"><div class="num">{t['step']} 3</div><h3>{t['s3h']}</h3><p>{t['s3']}</p></div>
    </div>
  </div></section>

  <section class="band"><div class="wrap">
    <h2>{t['who_h']}</h2>
    <div class="grid3">
      <div class="card"><h3>{t['w1h']}</h3><p>{t['w1']}</p></div>
      <div class="card"><h3>{t['w2h']}</h3><p>{t['w2']}</p></div>
      <div class="card"><h3>{t['w3h']}</h3><p>{t['w3']}</p></div>
    </div>
  </div></section>

  <section id="precios"><div class="wrap">
    <h2>{t['pr_h']}</h2>
    <p class="lead">{t['pr_lead']}</p>
    <div class="prices">
      <div class="card price"><h3>{t['p0']}</h3><b>0 €</b><small>{t['p0s']}</small><ul>{li(t['p0l'])}</ul></div>
      <div class="card price"><h3>{t['p1']}</h3><b>9 €</b><small>{t['p1s']}</small><ul>{li(t['p1l'])}</ul></div>
      <div class="card price hl"><h3>{t['p2']}</h3><b>19 €</b><small>{t['p2s']}</small><ul>{li(t['p2l'])}</ul></div>
      <div class="card price"><h3>{t['p3']}</h3><b>29 €</b><small>{t['p3s']}</small><ul>{li(t['p3l'])}</ul></div>
    </div>
  </div></section>

  <section id="lista" class="band"><div class="wrap">
    <h2>{t['wl_h']}</h2>
    <p class="lead">{t['wl_lead']}</p>
    <form id="wl" novalidate>
      <div class="row"><input type="email" id="email" name="email" placeholder="{t['email_ph']}" autocomplete="email" required aria-label="Email" maxlength="200">
        <select id="profile" aria-label="{t['who_label']}"><option value="particular">{t['o1']}</option><option value="reformista">{t['o2']}</option><option value="inmobiliaria">{t['o3']}</option><option value="otro">{t['o4']}</option></select></div>
      <label class="check"><input type="checkbox" id="consent"> <span>{t['consent']}</span></label>
      <div class="row"><button class="btn pri" type="submit" id="send">{t['send']}</button></div>
      <div class="msg" id="wl-msg" role="status"></div>
    </form>
  </div></section>

  <section><div class="wrap">
    <h2>{t['faq_h']}</h2>
    <details><summary>{t['q1']}</summary><p>{t['a1']}</p></details>
    <details><summary>{t['q2']}</summary><p>{t['a2']}</p></details>
    <details><summary>{t['q3']}</summary><p>{t['a3']}</p></details>
    <details><summary>{t['q4']}</summary><p>{t['a4']}</p></details>
    <details><summary>{t['q5']}</summary><p>{t['a5']}</p></details>
  </div></section>
</main>
<footer><div class="wrap">{t['foot']}</div></footer>
<script>
(function () {{
  'use strict';
  const API = {json.dumps(API)};
  const LANG = '{lang}', LANGS = {json.dumps(LANGS)}, M = {msgs};
  const ls = (k, v) => {{ try {{ return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); }} catch {{ return null; }} }};
  // First visit to the Spanish root: follow the device language once. A choice in the selector always wins.
  if (LANG === 'es' && !ls('lang')) {{
    const want = (navigator.languages || [navigator.language || '']).map(x => String(x).slice(0, 2).toLowerCase()).find(x => LANGS.includes(x));
    if (want && want !== 'es') {{ ls('lang', want); location.replace(want + '/' + location.hash); return; }}
  }}
  document.getElementById('lang').addEventListener('change', e => {{
    const l = e.target.value; ls('lang', l);
    location.href = (LANG === 'es' ? '' : '../') + (l === 'es' ? '' : l + '/') + location.hash;
  }});
  const f = document.getElementById('wl'), m = document.getElementById('wl-msg'), b = document.getElementById('send');
  const say = (t, err) => {{ m.textContent = t; m.className = 'msg' + (err ? ' err' : ''); }};
  f.addEventListener('submit', async e => {{
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    if (!/^[^\\s@]+@[^\\s@]+\\.[a-z]{{2,}}$/i.test(email)) return say(M.email, true);
    if (!document.getElementById('consent').checked) return say(M.consent, true);
    if (!API) return say(M.soon);
    b.disabled = true; say(M.saving);
    try {{
      const r = await fetch(API + '/waitlist', {{ method: 'POST', headers: {{ 'Content-Type': 'application/json' }}, body: JSON.stringify({{ email, consent: true, profile: document.getElementById('profile').value, source: location.hostname + '/' + LANG }}) }});
      if (!r.ok) throw new Error(String(r.status));
      f.reset(); say(M.ok);
    }} catch (err) {{ say(M.err, true); }}
    finally {{ b.disabled = false; }}
  }});
}})();
</script>
</body></html>
'''


for lang in LANGS:
    out = ROOT / ('index.html' if lang == 'es' else f'{lang}/index.html')
    out.parent.mkdir(exist_ok=True)
    out.write_text(page(lang))
print('landing built:', ', '.join(LANGS))
