const Aqi = require('../models/Aqi');

exports.getLatest = async (req, res) => {
  try {
    const data = await Aqi.find().sort({ createdAt: -1 }).limit(100);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const doc = new Aqi(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: 'Bad request' });
  }
};
