module.exports = {
  create: [
    {
      model: "text",
      path: "name",
      required: true,
    },
    {
      model: "address",
      path: "address",
      required: true,
    },
  ],

  update: [
    {
      label: "id",
      model: "id",
      type: "Number",
      required: true,
    },
    {
      model: "text",
      path: "name",
    },
    {
      label: "address",
      model: "address",
      type: "String",
    },
  ],

  delete: [
    {
      label: "id",
      path: "id",
      model: "id",
      type: "Number",
      required: true,
    },
  ],

  getByID: [
    {
      label: "id",
      path: "id",
      model: "id",
      type: "Number",
      required: true,
    },
  ],
  getAll: [],
};
