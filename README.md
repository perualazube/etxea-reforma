# Etxea Reforma

App web para móvil que reforma las estancias de la casa con IA a partir de fotos, vídeos y el plano.

## Puesta en marcha (una vez)

1. Abre la app en el móvil y en el menú del navegador elige **Añadir a pantalla de inicio**: queda instalada como una app.
2. Consigue una clave en [Google AI Studio](https://aistudio.google.com/apikey) y activa la facturación (las imágenes se pagan a Google, unos céntimos por foto; el vídeo cuesta más).
3. En la app: **Ajustes → Google Gemini → Clave de API**, pega la clave y pulsa **Probar conexión**.

La clave y todas las fotos se guardan solo en ese móvil. Para pasar el proyecto a otro móvil: **Ajustes → Exportar proyecto** y en el otro **Importar proyecto**.

## Cómo se usa

1. **Plano**: sube una foto o PDF del plano por planta y pulsa *Detectar estancias con IA*. Puedes recolocar las etiquetas y generar una **maqueta 3D** reformada.
2. **Estancia → Fotos**: haz fotos desde las esquinas o sube un vídeo y elige fotogramas. Añade **referencias** (un sofá, un azulejo que os guste).
3. **Diseño**: elige estilo y nivel (Retoque, Equilibrada, Completa), presupuesto y qué queréis. *Proponer reforma con IA* crea los cambios y los productos. Todo es editable: activar o quitar cada cambio, editar textos, decir qué se queda.
4. **Generar fotos**: mantiene la cámara, la distribución y la luz y aplica solo los cambios activos.
5. En cada foto: **Ajustar** con texto, **Zona** (pintas con el dedo lo que quieres cambiar y el resto queda idéntico), **Otra versión**, **Productos** (detecta qué comprar en la foto), **Vídeo IA**, ★ favorita y comparador antes/después.
6. **Compra**: todos los productos por estancia con precio, enlaces a la tienda y a comparar precios, marcar comprado, copiar o exportar CSV.
7. **Vídeo**: antes/después de una estancia o recorrido completo de la casa (se monta en el móvil, sin coste).

Modelos por defecto (cambiables en Ajustes): fotos `gemini-nano-banana-2.1`, vídeo `gemini-omni-1.1-flash`, diseño `gemini-3.8-flash`.
