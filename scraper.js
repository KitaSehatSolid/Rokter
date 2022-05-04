require('dotenv').config()
const axios = require('axios')
const cheerio = require('cheerio')

const ROOT_URL = process.env.ROOT_URL

async function rawByAlphabet(url)
{
    const response = await axios(url)
    const html = response.data
    const $ = cheerio.load(html)
    const data = JSON.parse($("search-a-z-2")[0].attribs['search-results']).map(val => ({
        title: val.post_title,
        permalink: val.permalink,
        source_url: `${ROOT_URL}/${val.permalink}`
    }))
    return {
        data,
        source: ROOT_URL
    }
}
async function rawByCard(url)
{
    const response = await axios.get(url)
    const html = response.data;
    const $ = cheerio.load(html)
    const dataRaw = $("card-post-index")
    const content = []
    for (const elm of dataRaw)
    {
        let objectData = {
            img: elm.attribs["image-url"],
            category: elm.attribs["category"],
            label: elm.attribs["label"],
            title: elm.attribs["title"],
            source_url: ROOT_URL + elm.attribs["url-path"],
        }
        content.push(objectData)
    }
    const paginate = {
        next: JSON.parse(JSON.stringify($("paginate-button")[0].attribs))['next-page'],
        prev: JSON.parse(JSON.stringify($("paginate-button")[0].attribs))['prev-page']
    }

    const data = {
        content: content.filter(con => con.category !== ""),
        paginate,
        source: ROOT_URL,
    }
    return data
}
async function rawByPost(url)
{
    const response = await axios.get(url)
    const html = response.data
    const $ = cheerio.load(html)
    const dataRaw = $('#postContent').children()
    let retVal = []
    if (dataRaw.length == 0) return null
    for (var i = 0; i < dataRaw.length; i++) retVal.push($(dataRaw[i]).html().replace(/<a.*?>/ig,'').replace(/<\/a>/ig, '').trim().replaceAll('<li>', '<li style="margin-left:1.1rem">'))
    if (retVal.length > 0)
    {
        let text = retVal.join('<br>').trim().replaceAll('\n', '').replaceAll('<br><li style="margin-left:1.1rem">', '<li style="margin-left:1.1rem">').replace('<br><strong>Kapan </strong><strong>Harus ke </strong><strong>Dokter</strong>', '</li><br><strong>Kapan Harus ke Dokter</strong>').replace('<br>Kapan Harus ke Dokter', '</li><br><strong>Kapan Harus ke Dokter</strong>').split('</li><br>')
        return text
    } 
    else return null
}
/**
 * @param {String} url 
 * @param {String} splitter 
 * @returns 
 */
async function rawByPost2(url, splitter)
{
    const response = await axios.get(url)
    const html = response.data
    const $ = cheerio.load(html)
    const dataRaw = $('.post-content').children()
    let retVal = []
    if (dataRaw.length == 0) return null
    let store = false
    for (var i = 0; i < dataRaw.length; i++)
    {
        let tagName = dataRaw[i].tagName
        if (tagName == 'h3') store = false
        let text = $(dataRaw[i]).html()
        if (tagName == 'h3' && text.includes('<strong>') && text.toLowerCase().includes(splitter)) 
        {
            store = true
            continue
        }
        if (store) retVal.push(text.replace(/<a.*?>/ig,'').replace(/<\/a>/ig, '').trim().replaceAll('<li>', '<li style="margin-left:1.1rem">'))
    }
    if (retVal.length > 0) return retVal.join('<br>').trim().replaceAll('\n', '').replaceAll('<br></strong><br>', '</strong><br>').replaceAll('<br><li style="margin-left:1.1rem">', '<li style="margin-left:1.1rem">').split('</li><br>')
    else return null
}
module.exports = {
    getAllPenyakit: async () => {
        const url = `${ROOT_URL}/penyakit-a-z`
        const data = await rawByAlphabet(url)
        return data
    },
    getSearchResult: async(searchkey, searchpage) => {
        const key = searchkey || ""
        const page = searchpage || 1
        const url = `${ROOT_URL}/search?s=${key}&page=${page}`
        const data = await rawByCard(url)
        return data
    },
    /**
     * 
     * @param {String} url 
     * @returns 
     */
    getContent: async(url, splitter = '') => {
        let data = null
        if (splitter.length > 0) data = await rawByPost2(url, splitter)
        else data = await rawByPost(url)
        return data
    }
}

const debug_mode = true
const debug = (msg) => {
    if (debug_mode) console.log(JSON.stringify(msg))
}
