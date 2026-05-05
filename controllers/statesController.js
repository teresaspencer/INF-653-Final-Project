// all your handler functions: one per endpoint 
// (GET all states, GET by state, GET funfact, 
// GET capital/nickname/population/admission)

const State = require('../model.States')
const statesDate = require('../data/statesData.json')

// helper function for other get functions
const mergeFunFacts = async (stateObj) => {
    stateFunFacts = await State.findOne({ stateCode: stateObj.code }).lean()
    if (stateFunFacts?.funfacts?.length) {
        return { ...stateObj, funfacts: stateFunFacts.funfacts }
    }
    return stateObj
}

const getAllStates = async (req, res) => {
    let filteredStates = [...statesData]
    if (req.query.contig === 'true') {
        filteredStates = filteredStates.filter(state => !['AK', 'HI'].includes(state.code))        
    } else if (req.query.contig === 'false') {
        filteredStates = filteredStates.filter(state => ['AK', 'HI'].includes(state.code))
    } const merged = await Promise.all(filteredStates.map(mergeFunFacts))
    res.json(merged)
}

const getState = async (req, res) => {
    
}