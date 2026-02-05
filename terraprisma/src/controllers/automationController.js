const automationModule = require('../modules/automationModule');

const portOut = async (req, res) => {
    try {
        const result = await automationModule.portOut(req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Automation failed' });
    }
};

module.exports = { portOut };
