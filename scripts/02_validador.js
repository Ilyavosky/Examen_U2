db = db.getSiblingDB("comercio_u2");

const schema = {
  bsonType: "object",
  required: ["_id", "clienteId", "almacen", "prioridad", "estado", "fecha", "articulos", "total"],
  properties: {
    _id: { bsonType: ["int", "long"] },
    clienteId: { bsonType: "string", minLength: 1 },
    almacen: { enum: ["Norte", "Centro", "Sur"] },
    prioridad: { enum: ["alta", "media", "baja"] },
    estado: { enum: ["pendiente", "preparacion", "enviado", "entregado"] },
    fecha: { bsonType: "date" },
    articulos: {
      bsonType: "array",
      minItems: 1,
      items: {
        bsonType: "object",
        required: ["sku", "cantidad", "precioUnitario"],
        properties: {
          sku: { bsonType: "string", minLength: 1 },
          cantidad: { bsonType: ["int", "long"], minimum: 1 },
          precioUnitario: { bsonType: ["int", "long", "double", "decimal"], minimum: 0, exclusiveMinimum: true }
        }
      }
    },
    total: { bsonType: ["int", "long", "double", "decimal"], minimum: 0, exclusiveMinimum: true },
    etiquetas: { bsonType: "array", items: { bsonType: "string" } },
    responsable: { bsonType: "string" }
  }
};

printjson(db.runCommand({
  collMod: "pedidos",
  validator: { $jsonSchema: schema },
  validationLevel: "strict",
  validationAction: "error"
}));

const options = db.getCollectionInfos({ name: "pedidos" })[0].options;
print("validationLevel: " + options.validationLevel);
print("validationAction: " + options.validationAction);
print("validador presente: " + (options.validator && options.validator.$jsonSchema ? "si" : "no"));

const invalid = db.pedidos.countDocuments({ $nor: [{ $jsonSchema: schema }] });
print("pedidos que incumplen el esquema: " + invalid + " (esperado 0)");
print("pedidos totales: " + db.pedidos.countDocuments({}) + " (esperado 12)");
