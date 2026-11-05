const source = db.getSiblingDB("comercio_u2");
const restored = db.getSiblingDB("comercio_u2_restaurada");

function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function indexSummary(database, name) {
  return database.getCollection(name).getIndexes()
    .map((i) => ({ name: i.name, key: i.key, unique: i.unique === true }))
    .sort((x, y) => x.name.localeCompare(y.name));
}

function collectionOptions(database, name) {
  const info = database.getCollectionInfos({ name: name })[0];
  return info ? info.options : null;
}

function mismatches(name) {
  let bad = 0;
  source.getCollection(name).find().forEach((doc) => {
    const copy = restored.getCollection(name).findOne({ _id: doc._id });
    if (!copy || !same(doc, copy)) {
      bad++;
    }
  });
  return bad;
}

const rows = [];
function row(concept, a, b) {
  rows.push({ concept: concept, origen: String(a), restaurada: String(b), coincide: same(a, b) });
}

row("pedidos (conteo)", source.pedidos.countDocuments({}), restored.pedidos.countDocuments({}));
row("productos (conteo)", source.productos.countDocuments({}), restored.productos.countDocuments({}));

[1, 7, 12].forEach((id) => {
  const a = source.pedidos.findOne({ _id: id });
  const b = restored.pedidos.findOne({ _id: id });
  row("pedido " + id + " idéntico", true, same(a, b));
});

row("pedidos distintos entre bases", 0, mismatches("pedidos"));
row("productos distintos entre bases", 0, mismatches("productos"));

const pedidosIdx = [indexSummary(source, "pedidos"), indexSummary(restored, "pedidos")];
const productosIdx = [indexSummary(source, "productos"), indexSummary(restored, "productos")];
rows.push({ concept: "índices de pedidos", origen: pedidosIdx[0].map((i) => i.name).join(","), restaurada: pedidosIdx[1].map((i) => i.name).join(","), coincide: same(pedidosIdx[0], pedidosIdx[1]) });
rows.push({ concept: "índices de productos", origen: productosIdx[0].map((i) => i.name + (i.unique ? "(unico)" : "")).join(","), restaurada: productosIdx[1].map((i) => i.name + (i.unique ? "(unico)" : "")).join(","), coincide: same(productosIdx[0], productosIdx[1]) });

const optA = collectionOptions(source, "pedidos");
const optB = collectionOptions(restored, "pedidos");
rows.push({ concept: "validador de pedidos", origen: optA && optA.validator ? "presente" : "ausente", restaurada: optB && optB.validator ? "presente" : "ausente", coincide: same(optA, optB) });
rows.push({ concept: "validationLevel / Action", origen: optA.validationLevel + "/" + optA.validationAction, restaurada: optB.validationLevel + "/" + optB.validationAction, coincide: optA.validationLevel === optB.validationLevel && optA.validationAction === optB.validationAction });

print("=== Comparación origen (comercio_u2) vs restaurada (comercio_u2_restaurada) ===");
rows.forEach((r) => {
  print(r.concept.padEnd(34) + " | " + r.origen.padEnd(34) + " | " + r.restaurada.padEnd(34) + " | " + (r.coincide ? "SI" : "NO"));
});
print("filas que no coinciden: " + rows.filter((r) => !r.coincide).length + " (esperado 0)");

print("=== El validador y el índice único funcionan en la base restaurada ===");
try {
  restored.pedidos.insertOne({
    _id: 500, clienteId: "C01", almacen: "Norte", prioridad: "alta", estado: "pendiente",
    fecha: new Date(Date.UTC(2026, 9, 21, 12, 0, 0)),
    articulos: [{ sku: "P01", cantidad: NumberInt(0), precioUnitario: 15000 }], total: 15000
  });
  print("RESULTADO INESPERADO: la base restaurada aceptó cantidad 0");
  restored.pedidos.deleteOne({ _id: 500 });
} catch (e) {
  print("cantidad 0 en la restaurada -> rechazado, code " + e.code);
}
try {
  restored.productos.insertOne({ sku: "P01", nombre: "Duplicado", precioUnitario: 1, existencias: NumberInt(1), almacen: "Norte" });
  print("RESULTADO INESPERADO: la base restaurada aceptó un SKU duplicado");
  restored.productos.deleteOne({ nombre: "Duplicado" });
} catch (e) {
  print("SKU duplicado en la restaurada -> rechazado, code " + e.code);
}

print("=== El origen no cambió ===");
print("pedidos origen: " + source.pedidos.countDocuments({}) + " (esperado 12)");
print("productos origen: " + source.productos.countDocuments({}) + " (esperado 5)");
print("pedidos restaurada: " + restored.pedidos.countDocuments({}) + " (esperado 12)");
print("productos restaurada: " + restored.productos.countDocuments({}) + " (esperado 5)");
