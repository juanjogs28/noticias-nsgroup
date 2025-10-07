const express = require("express");
const router = express.Router();
const Search = require("../models/searches.js");
const { requireAuth } = require("../middleware/auth.js");

// Ruta pública para obtener IDs técnicos por nombre de búsqueda
router.get("/by-name/:searchName", async (req, res) => {
  try {
    const { searchName } = req.params;
    
    // Buscar búsqueda por nombre (case insensitive)
    const search = await Search.findOne({ 
      name: { $regex: new RegExp(`^${searchName}$`, 'i') },
      isActive: true 
    });
    
    if (!search) {
      return res.status(404).json({ 
        message: "Búsqueda no encontrada",
        searchName 
      });
    }
    
    res.json({
      success: true,
      search: {
        id: search._id,
        name: search.name,
        countrySearchId: search.countrySearchId,
        sectorSearchId: search.sectorSearchId,
        isActive: search.isActive
      }
    });
  } catch (err) {
    console.error("Error obteniendo búsqueda por nombre:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Aplicar autenticación a todas las rutas de admin
router.use(requireAuth);

// GET todas las búsquedas
router.get("/", async (req, res) => {
  try {
    const searches = await Search.find().sort({ createdAt: -1 });
    res.json({ searches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error obteniendo búsquedas" });
  }
});

// POST crear búsqueda
router.post("/", async (req, res) => {
  try {
    const { name, countrySearchId, sectorSearchId } = req.body;
    
    if (!name || !countrySearchId || !sectorSearchId) {
      return res.status(400).json({ message: "Nombre, countrySearchId y sectorSearchId son requeridos" });
    }

    const search = new Search({
      name,
      countrySearchId,
      sectorSearchId,
    });
    
    const saved = await search.save();
    res.json({ success: true, search: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creando búsqueda" });
  }
});

// PATCH actualizar búsqueda
router.patch("/:id", async (req, res) => {
  try {
    const { name, countrySearchId, sectorSearchId, isActive } = req.body;
    
    // Verificar que la búsqueda existe
    const existingSearch = await Search.findById(req.params.id);
    if (!existingSearch) {
      return res.status(404).json({ message: "Búsqueda no encontrada" });
    }
    
    // Preparar datos de actualización
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (countrySearchId !== undefined) updateData.countrySearchId = countrySearchId;
    if (sectorSearchId !== undefined) updateData.sectorSearchId = sectorSearchId;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Actualizar búsqueda
    const updated = await Search.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({ success: true, search: updated });
  } catch (err) {
    console.error("Error actualizando búsqueda:", err);
    res.status(500).json({ message: "Error actualizando búsqueda" });
  }
});

// DELETE búsqueda
router.delete("/:id", async (req, res) => {
  try {
    await Search.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error borrando búsqueda" });
  }
});

module.exports = router;
