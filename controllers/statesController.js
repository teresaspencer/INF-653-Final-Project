// all your handler functions: one per endpoint 
// (GET all states, GET by state, GET funfact, 
// GET capital/nickname/population/admission)

const State = require('../model/States')
const statesData = require('../data/statesData.json')

// helper function for other get functions
const mergeFunFacts = async (stateObj) => {
    const stateFunFacts = await State.findOne({ stateCode: stateObj.code }).lean()
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
    const state = statesData.find(s => s.code === req.code)
    const merged = await mergeFunFacts(state)
    res.json(merged)
}

const getFunFact = async (req, res) => {
    const state = await State.findOne({ stateCode: req.code}).lean()
    if (!state?.funfacts?.length) {
        const stateName = statesData.find(s => s.code === req.code).state
        return res.status(404).json({ message: `No Fun Facts found for ${stateName}` })
    }
    const randomIndex = Math.floor(Math.random() * state.funfacts.length)
    res.json({ funfact: state.funfacts[randomIndex] })
}

const getCapital = (req, res) => {
    const state = statesData.find(s => s.code === req.code)
    res.json({ state: state.state, capital: state.capital_city })
}

const getNickname = (req, res) => {
    const state = statesData.find(s => s.code === req.code)
    res.json({ state: state.state, nickname: state.nickname })
}

const getPopulation = (req, res) => {
    const state = statesData.find(s => s.code === req.code)
    res.json({ state: state.state, population: state.population.toLocaleString() })
}

const getAdmission = (req, res) => {
    const state = statesData.find(s => s.code === req.code)
    res.json({ state: state.state, admitted: state.admission_date })
}

const createFunFacts = async (req, res) => {
    const { funfacts } = req.body
    if (!funfacts) {
        return res.status(400).json({ message: 'State fun facts value required' })
    }
    if (!Array.isArray(funfacts)) {
        return res.status(400).json({ message: 'State fun facts value must be an array' })
    }
    let stateDoc = await State.findOne({ stateCode: req.code })
    if (!stateDoc) {
        stateDoc = await State.create({ stateCode: req.code, funfacts })
    } else {
        stateDoc.funfacts = [...stateDoc.funfacts, ...funfacts]
        await stateDoc.save()
    }
    res.json(stateDoc)
}

const updateFunFact = async (req, res) => {
    const { index, funfact } = req.body
    if (!index) {
        return res.status(400).json({ message: 'State fun fact index value required' })
    }
    if (!funfact) {
        return res.status(400).json({ message: 'State fun fact value required' })
    }
    const stateDoc = await State.findOne({ stateCode: req.code })
    if (!stateDoc?.funfacts?.length) {
        const stateName = statesData.find(s => s.code === req.code).state
        return res.status(404).json({ message: `No Fun Facts found for ${stateName}` })
    }
    const arrayIndex = Number(index) - 1
    if (arrayIndex < 0 || arrayIndex >= stateDoc.funfacts.length) {
        return res.status(400).json({ message: `No Fun Fact found at that index for ${statesData.find(s => s.code === req.code).state}` })
    }
    stateDoc.funfacts[arrayIndex] = funfact 
    await stateDoc.save()
    res.json(stateDoc)
}

const deleteFunFact = async (req, res) => {
    const { index } = req.body
    if (!index) {
        return res.status(400).json({ message: 'State fun fact index value required' })
    }
    const stateDoc = await State.findOne({ stateCode: req.code })
    if (!stateDoc?.funfacts?.length) {
        const stateName = statesData.find(s => s.code === req.code).state
        return res.status(404).json({ message: `No Fun Facts found for ${stateName}` })
    }
    const arrayIndex = Number(index) - 1
    if (arrayIndex < 0 || arrayIndex >= stateDoc.funfacts.length) {
        return res.status(400).json({ message: `No Fun Fact found at that index for ${statesData.find(s => s.code === req.code).state}` })
    }
    stateDoc.funfacts = stateDoc.funfacts.filter((_, i) => i !== arrayIndex)
    await stateDoc.save()
    res.json(stateDoc)
}

// export all created functions
module.exports = {
    getAllStates,
    getState,
    getFunFact,
    getCapital,
    getNickname,
    getPopulation,
    getAdmission,
    createFunFacts,
    updateFunFact,
    deleteFunFact,
}