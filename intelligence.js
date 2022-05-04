require('dotenv').config()
const { getAllPenyakit, getContent } = require('./scraper')
const Wit = require('node-wit').Wit
const { getSearchResult } = require('./scraper')

let cachePenyakit = []

const client = new Wit({
    accessToken: process.env.WIT_TOKEN
})

function getElement(obj, key, index = 0)
{
    const val = obj && obj[key] && Array.isArray(obj[key]) && obj[key].length > 0 && obj[key][index]
    if (!val) return null
    return val
}

var self = module.exports = {
    performQuestion: async (question) => {
        const msg = await client.message(question)
        let answer = await self.handleMessage(msg)
        if (!answer) answer = 'Maaf, saya tidak mengerti apa yang anda maksud.'
        return answer
    },
    handleMessage: async ({intents, entities, traits}) => {
        const intention = intents.length > 0 && intents[0]
        if (!intention) return null
        switch(intention.name) {
            case 'sapaan': {
                return [
                    `Hai. Saya adalah Rokter, asisten virtual anda yang bertugas untuk menyajikan informasi seputar dunia kesehatan`,
                    `Informasi yang disajikan dapat berupa penjelasan mengenai pengertian dari penyakit, penyebab, gejala, diagnosis, pengobatan, komplikasi, serta langkah pencegahannya`
                ]
            }
            case 'tanya_diagnosis':
            case 'tanya_gejala':
            case 'tanya_penyebab': {
                let content = null
                let shortIntent = intention.name.split('_')[1]
                let nama_penyakit = getElement(entities, 'nama_penyakit:nama_penyakit')
                if (!nama_penyakit) return null
                content = await getContent(`${process.env.ROOT_URL}/${nama_penyakit.body.toLowerCase().replace(' ', '-')}/${shortIntent}`)
                if (!content)
                {
                    content = await getContent(`${process.env.ROOT_URL}/${nama_penyakit.body.toLowerCase().replace(' ', '-')}`, shortIntent)
                }
                if (!content)
                {
                    let resultUrl = await self.performSearch(nama_penyakit.body)
                    if (!resultUrl) return null
                    let found = resultUrl.filter(r => r.title.toLowerCase() === nama_penyakit.body.toLowerCase())[0]
                    if (!found) found = resultUrl[0]
                    content = await getContent(`${found.source_url}/${shortIntent}`)
                }
                return content
            }
            default:
                return null
        }
    },
    performSearch: async (query, page = 1) => {
        cachePenyakit = (cachePenyakit.length == 0)? await getAllPenyakit() : cachePenyakit
        const penyakit = await getSearchResult(query)
        const results = penyakit.content.filter(({ source_url: id1 }) => cachePenyakit.data.some(({ source_url: id2 }) => id2 === id1));
        return results
    }
}
