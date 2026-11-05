db = db.getSiblingDB("comercio_u2");

const indexName = "estado_1_prioridad_1";
const query = { estado: "pendiente", prioridad: "alta" };

if (db.pedidos.getIndexes().some((i) => i.name === indexName)) {
  db.pedidos.dropIndex(indexName);
  print("índice previo eliminado para repetir la prueba");
}

function stageChain(explainResult) {
  const wp = explainResult.queryPlanner.winningPlan;
  let node = wp.queryPlan || wp;
  const names = [];
  while (node) {
    names.push(node.stage);
    node = node.inputStage;
  }
  return names.join(" > ");
}

function measure(label) {
  const e = db.pedidos.find(query).explain("executionStats");
  const s = e.executionStats;
  print("--- " + label + " ---");
  print("plan ganador: " + stageChain(e));
  print("nReturned: " + s.nReturned);
  print("totalDocsExamined: " + s.totalDocsExamined);
  print("totalKeysExamined: " + s.totalKeysExamined);
  print("executionTimeMillis: " + s.executionTimeMillis);
  return s;
}

print("consulta: " + JSON.stringify(query));
print("índices antes: " + JSON.stringify(db.pedidos.getIndexes().map((i) => i.name)));
const before = measure("ANTES del índice");

print("createIndex: " + db.pedidos.createIndex({ estado: 1, prioridad: 1 }, { name: indexName }));
print("índices después: " + JSON.stringify(db.pedidos.getIndexes().map((i) => i.name)));
const after = measure("DESPUÉS del índice");

print("--- Comparación ---");
print("nReturned: " + before.nReturned + " -> " + after.nReturned);
print("totalDocsExamined: " + before.totalDocsExamined + " -> " + after.totalDocsExamined);
print("totalKeysExamined: " + before.totalKeysExamined + " -> " + after.totalKeysExamined);

try {
  const stats = db.pedidos.aggregate([{ $collStats: { storageStats: {} } }]).toArray()[0].storageStats;
  print("tamaño de datos (bytes): " + stats.size);
  print("tamaño de índices (bytes): " + JSON.stringify(stats.indexSizes));
} catch (e) {
  print("no se pudo leer collStats: " + e.message);
}
