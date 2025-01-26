module.exports = {
  create: [
    {
      model: "roomName",
      path: "name",
      required: true,
    },
    {
      model: "id",
      path: "schoolID",
      required: true,
    },
  ],
  update: [
    {
      label: "id",
      path: "id",
      model: "id",
      type: "Number",
      required: true,
    },
    {
      model: "roomName",
      path: "name",
    },
    {
      model: "id",
      path: "schoolID",
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
