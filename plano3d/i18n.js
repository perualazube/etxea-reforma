// Texts of the 3D viewer in eu/en/ca/fr. Spanish stays in the HTML and the code; each entry maps it to [eu, en, ca, fr].
// Language: the one chosen in the app or on the website (localStorage 'lang', shared on this origin), else the browser's.
(function () {
'use strict';
const LANGS = ['es', 'eu', 'en', 'ca', 'fr'];
const D = {
  'EtxeBerriAI · Plano 3D': ['EtxeBerriAI · 3D planoa', 'EtxeBerriAI · 3D plan', 'EtxeBerriAI · Plànol 3D', 'EtxeBerriAI · Plan 3D'],
  'Plano 3D': ['3D planoa', '3D plan', 'Plànol 3D', 'Plan 3D'],
  'Arrastra para girar, pellizca o usa la rueda para acercar.': ['Arrastatu biratzeko; atximurtu edo erabili gurpila hurbiltzeko.', 'Drag to rotate, pinch or use the wheel to zoom.', "Arrossega per girar; pessiga o fes servir la roda per apropar-te.", 'Faites glisser pour pivoter, pincez ou utilisez la molette pour zoomer.'],
  'Volver a la app': ['Itzuli aplikaziora', 'Back to the app', "Torna a l'app", "Retour à l'appli"],
  'Acabados': ['Akaberak', 'Finishes', 'Acabats', 'Finitions'],
  'Estado actual': ['Gaur egungo egoera', 'Current state', 'Estat actual', 'État actuel'],
  'Propuesta': ['Proposamena', 'Proposal', 'Proposta', 'Proposition'],
  'Paredes': ['Hormak', 'Walls', 'Parets', 'Murs'],
  'Paredes altas': ['Horma altuak', 'Tall walls', 'Parets altes', 'Murs hauts'],
  'Bajas': ['Baxuak', 'Low', 'Baixes', 'Bas'],
  'Vista': ['Ikuspegia', 'View', 'Vista', 'Vue'],
  'Planta': ['Oinplanoa', 'Top', 'Planta', 'Plan'],
  'Crear desde boceto': ['Sortu zirriborrotik', 'Create from sketch', 'Crea des d\'un esbós', "Créer depuis un croquis"],
  'Datos': ['Datuak', 'Data', 'Dades', 'Données'],
  'Estancias': ['Gelak', 'Rooms', 'Estances', 'Pièces'],
  'Total aprox.': ['Guztira, gutxi gorabehera', 'Approx. total', 'Total aprox.', 'Total approx.'],
  'Crear el plano desde un boceto': ['Sortu planoa zirriborro batetik', 'Create the plan from a sketch', "Crea el plànol des d'un esbós", "Créer le plan à partir d'un croquis"],
  'Sube una foto del boceto o del plano de una planta. La IA lo convierte en estancias, puertas y ventanas; si algo no cuadra, corrígelo en «Datos». Usa la clave o el código de acceso que tengas en los Ajustes de la app.': [
    'Igo solairu baten zirriborroaren edo planoaren argazki bat. AAk gela, ate eta leiho bihurtzen du; zerbait ez badator bat, zuzendu «Datuak» atalean. Aplikazioaren Ezarpenetan duzun gakoa edo sarbide-kodea erabiltzen du.',
    "Upload a photo of the sketch or plan of one floor. The AI turns it into rooms, doors and windows; if something doesn't fit, fix it in «Data». It uses the key or access code you have in the app Settings.",
    "Puja una foto de l'esbós o del plànol d'una planta. La IA el converteix en estances, portes i finestres; si alguna cosa no quadra, corregeix-la a «Dades». Fa servir la clau o el codi d'accés que tinguis a la Configuració de l'app.",
    "Importez une photo du croquis ou du plan d'un étage. L'IA le transforme en pièces, portes et fenêtres ; si quelque chose ne colle pas, corrigez-le dans « Données ». Elle utilise la clé ou le code d'accès des Réglages de l'appli."],
  'Elegir foto del boceto': ['Aukeratu zirriborroaren argazkia', 'Choose a photo of the sketch', "Tria una foto de l'esbós", 'Choisir une photo du croquis'],
  'Generar plano 3D': ['Sortu 3D planoa', 'Generate 3D plan', 'Genera el plànol 3D', 'Générer le plan 3D'],
  'Cerrar': ['Itxi', 'Close', 'Tanca', 'Fermer'],
  'Datos del plano': ['Planoaren datuak', 'Plan data', 'Dades del plànol', 'Données du plan'],
  'Medidas en metros, origen arriba a la izquierda. Cambia números o colores y pulsa Aplicar.': ['Neurriak metrotan, jatorria goian ezkerrean. Aldatu zenbakiak edo koloreak eta sakatu Aplikatu.', 'Measurements in metres, origin at the top left. Change numbers or colours and press Apply.', "Mides en metres, origen a dalt a l'esquerra. Canvia números o colors i prem Aplica.", 'Mesures en mètres, origine en haut à gauche. Modifiez les nombres ou les couleurs et appuyez sur Appliquer.'],
  'JSON del plano': ['Planoaren JSONa', 'Plan JSON', 'JSON del plànol', 'JSON du plan'],
  'Aplicar': ['Aplikatu', 'Apply', 'Aplica', 'Appliquer'],
  'Ejemplo: Etxea': ['Adibidea: Etxea', 'Example: Etxea', 'Exemple: Etxea', 'Exemple : Etxea'],
  'Descargar': ['Deskargatu', 'Download', 'Baixa', 'Télécharger'],
  'Toca una estancia para acercarte': ['Ukitu gela bat hurbiltzeko', 'Tap a room to zoom in', "Toca una estança per apropar-t'hi", 'Touchez une pièce pour zoomer'],
  'Cerrar foto': ['Itxi argazkia', 'Close photo', 'Tanca la foto', 'Fermer la photo'],
  'Tu reforma': ['Zure berrikuntza', 'Your makeover', 'La teva reforma', 'Votre rénovation'],
  'Foto reformada': ['Argazki berritua', 'Renovated photo', 'Foto reformada', 'Photo rénovée'],
  'Boceto elegido': ['Aukeratutako zirriborroa', 'Chosen sketch', 'Esbós triat', 'Croquis choisi'],
  'Plano actualizado.': ['Planoa eguneratuta.', 'Plan updated.', 'Plànol actualitzat.', 'Plan mis à jour.'],
  'El texto no es JSON válido:': ['Testua ez da baliozko JSON:', 'The text is not valid JSON:', 'El text no és un JSON vàlid:', "Le texte n'est pas un JSON valide :"],
  'No se pudo leer la imagen.': ['Ezin izan da irudia irakurri.', "Couldn't read the image.", "No s'ha pogut llegir la imatge.", "Impossible de lire l'image."],
  'No te quedan créditos.': ['Ez zaizu krediturik geratzen.', 'You have no credits left.', 'No et queden crèdits.', "Il ne vous reste plus de crédits."],
  'El código de acceso no es válido.': ['Sarbide-kodea ez da baliozkoa.', 'The access code is not valid.', "El codi d'accés no és vàlid.", "Le code d'accès n'est pas valide."],
  'La IA respondió con un error:': ['AAk errore batekin erantzun du:', 'The AI replied with an error:', 'La IA ha respost amb un error:', "L'IA a répondu par une erreur :"],
  'La IA no devolvió un plano. Prueba con una foto más nítida.': ['AAk ez du planorik itzuli. Probatu argazki argiago batekin.', "The AI didn't return a plan. Try a sharper photo.", 'La IA no ha retornat cap plànol. Prova amb una foto més nítida.', "L'IA n'a pas renvoyé de plan. Essayez une photo plus nette."],
  'Falta la clave de Gemini o el código de acceso. Ponlo en': ['Gemini gakoa edo sarbide-kodea falta da. Jarri', 'The Gemini key or access code is missing. Add it in', "Falta la clau de Gemini o el codi d'accés. Posa-la a", "Il manque la clé Gemini ou le code d'accès. Ajoutez-le dans"],
  'la app': ['aplikazioan', 'the app', "l'app", "l'appli"],
  ', en Ajustes.': [', Ezarpenetan.', ', in Settings.', ', a Configuració.', ', dans les Réglages.'],
  'La IA está leyendo el boceto. Tarda unos 20 segundos...': ['AA zirriborroa irakurtzen ari da. 20 segundo inguru behar ditu...', 'The AI is reading the sketch. It takes about 20 seconds...', "La IA està llegint l'esbós. Triga uns 20 segons...", "L'IA lit le croquis. Cela prend environ 20 secondes..."],
  'Listo: {0} estancias, {1} m². Revisa las medidas en «Datos».': ['Prest: {0} gela, {1} m². Begiratu neurriak «Datuak» atalean.', 'Done: {0} rooms, {1} m². Check the measurements in «Data».', 'Fet: {0} estances, {1} m². Revisa les mides a «Dades».', 'Terminé : {0} pièces, {1} m². Vérifiez les mesures dans « Données ».'],
  'No se pudo generar el plano.': ['Ezin izan da planoa sortu.', "Couldn't generate the plan.", "No s'ha pogut generar el plànol.", 'Impossible de générer le plan.'],
  // Rooms and changes of the Etxea demo shown on the website.
  'Etxea · Primera planta': ['Etxea · Lehen solairua', 'Etxea · First floor', 'Etxea · Primera planta', 'Etxea · Premier étage'],
  'Sala de lavandería': ['Garbitegia', 'Laundry room', 'Safareig', 'Buanderie'],
  'Cocina': ['Sukaldea', 'Kitchen', 'Cuina', 'Cuisine'],
  'Baño 1': ['1. bainugela', 'Bathroom 1', 'Bany 1', 'Salle de bain 1'],
  'Recibidor': ['Harrera', 'Hall', 'Rebedor', 'Entrée'],
  'Caja de escalera': ['Eskailera-kaxa', 'Stairwell', "Caixa d'escala", "Cage d'escalier"],
  'Sala comedor': ['Egongela-jangela', 'Living-dining room', 'Sala menjador', 'Salon-salle à manger'],
  'Paredes en blanco roto cálido': ['Hormak zuri hautsi beroan', 'Walls in warm off-white', 'Parets en blanc trencat càlid', 'Murs en blanc cassé chaud'],
  'Parquet acuchillado en tono natural mate': ['Parket arraspatua, tonu natural matean', 'Sanded parquet in a natural matte tone', 'Parquet polit en to natural mat', 'Parquet poncé ton naturel mat'],
  'Frentes de cocina en verde salvia': ['Sukaldeko aurrealdeak salbia berdean', 'Kitchen fronts in sage green', 'Frontals de cuina en verd sàlvia', 'Façades de cuisine vert sauge'],
  'Mesa de centro de madera y alfombra de yute': ['Egurrezko erdiko mahaia eta jute-alfonbra', 'Wooden coffee table and jute rug', 'Tauleta de centre de fusta i catifa de jute', 'Table basse en bois et tapis en jute']
};
const NAMES = { eu: 'euskera', en: 'inglés', ca: 'catalán', fr: 'francés', es: 'español' };
function detect() {
  let l = null; try { l = localStorage.getItem('lang'); } catch {}
  if (LANGS.includes(l)) return l;
  for (const x of navigator.languages || [navigator.language || 'es']) { const k = String(x).slice(0, 2).toLowerCase(); if (LANGS.includes(k)) return k; }
  return 'es';
}
const LANG = detect(), I = LANGS.indexOf(LANG) - 1;
const t = (s, ...args) => { const v = I >= 0 && D[s] ? D[s][I] : s; return args.reduce((o, a, i) => o.replace('{' + i + '}', a), v); };
// Static texts and labels of the page.
function translatePage() {
  document.documentElement.lang = LANG;
  if (I < 0) return;
  document.title = t(document.title);
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { const s = n.data.trim(); if (s && D[s]) n.data = n.data.replace(s, t(s)); }
  document.querySelectorAll('[aria-label],[alt]').forEach(e => ['aria-label', 'alt'].forEach(a => { const v = e.getAttribute(a); if (v && D[v]) e.setAttribute(a, t(v)); }));
}
window.PlanoI18n = { LANG, t, translatePage, langName: NAMES[LANG] };
})();
