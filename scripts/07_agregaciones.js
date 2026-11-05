db = db.getSiblingDB("comercio_u2");

print("=== Pipeline 1: distribución de pedidos por estado ===");
const byState = db.pedidos.aggregate([
  { $group: { _id: "$estado", pedidos: { $sum: 1 } } },
  { $sort: { pedidos: -1, _id: 1 } }
]).toArray();
printjson(byState);

const expectedState = { pendiente: 4, preparacion: 2, enviado: 2, entregado: 4 };
const gotState = {};
byState.forEach((r) => { gotState[r._id] = r.pedidos; });
print("esperado: " + JSON.stringify(expectedState));
print("obtenido: " + JSON.stringify(gotState));
print("coincide: " + (JSON.stringify(Object.keys(expectedState).sort().map((k) => expectedState[k])) === JSON.stringify(Object.keys(expectedState).sort().map((k) => gotState[k]))));

print("=== Pipeline 2: por almacén, pedidos, importe y unidades ===");
const byWarehouse = db.pedidos.aggregate([
  { $unwind: "$articulos" },
  {
    $group: {
      _id: "$almacen",
      pedidosUnicos: { $addToSet: "$_id" },
      importe: { $sum: { $multiply: ["$articulos.cantidad", "$articulos.precioUnitario"] } },
      unidades: { $sum: "$articulos.cantidad" }
    }
  },
  { $project: { _id: 1, pedidos: { $size: "$pedidosUnicos" }, importe: 1, unidades: 1 } },
  { $sort: { importe: -1 } }
]).toArray();
printjson(byWarehouse);

const expectedWarehouse = [
  { _id: "Norte", pedidos: 4, importe: 35400, unidades: 5 },
  { _id: "Sur", pedidos: 3, importe: 12800, unidades: 4 },
  { _id: "Centro", pedidos: 5, importe: 4700, unidades: 11 }
];
print("esperado: " + JSON.stringify(expectedWarehouse));
print("obtenido: " + JSON.stringify(byWarehouse));
print("coincide: " + (JSON.stringify(expectedWarehouse) === JSON.stringify(byWarehouse.map((r) => ({ _id: r._id, pedidos: r.pedidos, importe: r.importe, unidades: r.unidades })))));

const topRevenue = byWarehouse.slice().sort((a, b) => b.importe - a.importe)[0];
const topUnits = byWarehouse.slice().sort((a, b) => b.unidades - a.unidades)[0];
print("almacén con mayor ingreso: " + topRevenue._id + " (" + topRevenue.importe + " MXN)");
print("almacén con más unidades: " + topUnits._id + " (" + topUnits.unidades + " unidades)");
print("importe acumulado total: " + byWarehouse.reduce((s, r) => s + r.importe, 0) + " (esperado 52900)");
