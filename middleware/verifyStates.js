// validates :state URL params, converts to uppercase, 
// attaches req.code before calling next(). 
// Used on nearly every route.

const statesData = require('../data/statesData.json')
const stateCodes = statesData.map(state => state.code)
const verifyStates = (req, res, next) => {
    const stateParam = req.params.state?.toUpperCase()
    if (!stateCodes.includes(stateParam)) {
        return res.status(400).json({
            message: 'Invalid state abbreviation parameter'
        })
    }
    req.code = stateParam
    next()
}

module.exports = verifyStates