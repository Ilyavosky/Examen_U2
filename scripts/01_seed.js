db = db.getSiblingDB("comercio_u2");

print("Base activa: " + db.getName());
printjson(db.runCommand({ ping: 1 }));

const alreadyLoaded = db.productos.countDocuments({}) > 0 || db.pedidos.countDocuments({}) > 0;
if (alreadyLoaded) {
  print("Las colecciones ya contienen datos. Se omite la carga y solo se verifica.");
}

const products = [
  { sku: "P01", nombre: "Computadora portátil", precioUnitario: 15000, existencias: NumberInt(8), almacen: "Norte" },
  { sku: "P02", nombre: "Teclado", precioUnitario: 500, existencias: NumberInt(40), almacen: "Centro" },
  { sku: "P03", nombre: "Monitor", precioUnitario: 3200, existencias: NumberInt(12), almacen: "Sur" },
  { sku: "P04", nombre: "Mouse", precioUnitario: 300, existencias: NumberInt(50), almacen: "Centro" },
  { sku: "P05", nombre: "Router", precioUnitario: 1800, existencias: NumberInt(15), almacen: "Norte" }
];

const catalog = {};
products.forEach((p) => { catalog[p.sku] = p; });

const rows = [
  [1, "C01", "P01", 1, "alta", "pendiente", 15],
  [2, "C02", "P02", 2, "media", "preparacion", 15],
  [3, "C03", "P03", 1, "alta", "enviado", 16],
  [4, "C04", "P04", 3, "baja", "pendiente", 16],
  [5, "C01", "P05", 2, "alta", "preparacion", 17],
  [6, "C02", "P02", 4, "media", "entregado", 17],
  [7, "C03", "P03", 2, "alta", "pendiente", 18],
  [8, "C04", "P04", 1, "baja", "pendiente", 18],
  [9, "C01", "P01", 1, "media", "entregado", 19],
  [10, "C02", "P05", 1, "alta", "enviado", 19],
  [11, "C03", "P02", 1, "media", "entregado", 20],
  [12, "C04", "P03", 1, "baja", "entregado", 20]
];

const withResponsible = [2, 5, 10];

const orders = rows.map(([id, clienteId, sku, qty, prioridad, estado, day]) => {
  const product = catalog[sku];
  const doc = {
    _id: id,
    clienteId: clienteId,
    almacen: product.almacen,
    prioridad: prioridad,
    estado: estado,
    fecha: new Date(Date.UTC(2026, 9, day, 12, 0, 0)),
    articulos: [{ sku: sku, cantidad: NumberInt(qty), precioUnitario: product.precioUnitario }],
    total: qty * product.precioUnitario,
    etiquetas: ["web", prioridad]
  };
  if (withResponsible.includes(id)) {
    doc.responsable = "operaciones";
  }
  return doc;
});

if (!alreadyLoaded) {
  printjson(db.productos.insertMany(products).acknowledged);
  printjson(db.pedidos.insertMany(orders).acknowledged);
}

print("--- Verificación ---");
print("productos: " + db.productos.countDocuments({}) + " (esperado 5)");
print("pedidos: " + db.pedidos.countDocuments({}) + " (esperado 12)");
print("fechas tipo date: " + db.pedidos.countDocuments({ fecha: { $type: "date" } }) + " (esperado 12)");
print("con responsable: " + JSON.stringify(db.pedidos.find({ responsable: "operaciones" }, { _id: 1 }).sort({ _id: 1 }).toArray().map((d) => d._id)) + " (esperado [2,5,10])");

const expectedTotals = [15000, 1000, 3200, 900, 3600, 2000, 6400, 300, 15000, 1800, 500, 3200];
const stored = db.pedidos.find({}, { total: 1 }).sort({ _id: 1 }).toArray().map((d) => d.total);
print("totales guardados:  " + JSON.stringify(stored));
print("totales esperados:  " + JSON.stringify(expectedTotals));
print("coinciden: " + (JSON.stringify(stored) === JSON.stringify(expectedTotals)));

const mismatches = db.pedidos.aggregate([
  { $addFields: { calculado: { $sum: { $map: { input: "$articulos", as: "a", in: { $multiply: ["$$a.cantidad", "$$a.precioUnitario"] } } } } } },
  { $match: { $expr: { $ne: ["$total", "$calculado"] } } },
  { $project: { _id: 1, total: 1, calculado: 1 } }
]).toArray();
print("pedidos con total distinto a cantidad x precio: " + mismatches.length + " (esperado 0)");

const grand = db.pedidos.aggregate([{ $group: { _id: null, suma: { $sum: "$total" } } }]).toArray()[0].suma;
print("suma global: " + grand + " (esperado 52900)");

const wrongWarehouse = db.pedidos.aggregate([
  { $unwind: "$articulos" },
  { $lookup: { from: "productos", localField: "articulos.sku", foreignField: "sku", as: "p" } },
  { $unwind: "$p" },
  { $match: { $expr: { $ne: ["$almacen", "$p.almacen"] } } }
]).toArray();
print("pedidos con almacén distinto al del producto: " + wrongWarehouse.length + " (esperado 0)");
