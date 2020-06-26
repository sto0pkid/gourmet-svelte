/**
dexieApi.js implements the interface for storing recipes in IndexDB

**/

import {prepRecLocal} from '../data/validate.js';
import Dexie from 'dexie';
import stopword from 'stopword'

const dexieApi = {
    async connect () {
        dexieApi.db = new Dexie('Recipes');
        dexieApi.db.version(7)
            .stores({
                recipes:'++id,&_id,*words,*ings,*categoryNames,*sourceNames,isShoppingList,deleted,savedRemote'
            });
        return true;
    },

    addRecipe (recipe) {
        return dexieApi.db.recipes.add(
            prepRecLocal(recipe)
        );
    },

    getRecipe (recid, {mongoId}={}) {
        if (mongoId) {
            console.log('Fetch mongo...',mongoId);
            return dexieApi.db.recipes.get(
                {_id:mongoId}
            );
        }
        else {
            console.log('fetch standard',recid);
            return dexieApi.db.recipes.get({id:recid})
        }
    },

    async getSources () {
        if (dexieApi.db) {
            return await dexieApi.db.recipes.orderBy('sourcesNames').uniqueKeys()
        } else {
            return []
        }
    },

    async getCategories () {
        if (dexieApi.db) {
            return await dexieApi.db.recipes.orderBy('categoryNames').uniqueKeys();
        } else {
            return []
        }
    },

    searchWord (word, {deleted}={}) {
        let q = dexieApi.db.recipes
        q = q.where('words').startsWith(
            word.toLowerCase()
        );
        if (deleted!==undefined) {
            q = q.and((o)=>o.deleted==deleted);
        }
        q = q.and((o)=>!o.isShoppingList);
        return q
    },

    async searchWords (words, {deleted}={}) {
        words = stopword.removeStopwords(words);
        console.log('searchWords',words);
        let q = dexieApi.db.recipes
        var ids = undefined;
        for (let word of words) {
            let subResults = dexieApi.searchWord(word,{deleted});
            let subIds = await subResults.distinct().primaryKeys()
            if (!ids) {
                ids = subIds;
            } else {
                ids = ids.filter(
                    (id)=>subIds.includes(id)
                );
                if (ids.length == 0) {
                    return undefined
                }
            }
        }
        q = q.where(':id').anyOf(ids);
        q.alreadyCounted = ids.length;
        return q;
    },

    async getRecipes({query,fields,limit,page,sort}={}) {
        let q = dexieApi.db.recipes
        if (query && query.isShoppingList) {
            q = dexieApi.db.recipes.where('isShoppingList').equals(1)
        } else if (query && query.fulltext) {
            // Note: we split words by \s when we full-text index
            query.fulltext = query.fulltext.replace(/^\s+|\s+$/g,'')
            if (query.fulltext.indexOf(' ')>-1) {
                console.log('Query is: ',query.fulltext.split(/\s+/))
                q = await dexieApi.searchWords(
                    query.fulltext.split(/\s+/),
                    query // this object hands in deleted
                )
            }
            else {
                console.log('Query is: ',query.fulltext)
                q = dexieApi.searchWord(query.fulltext,query);
            }
        } else if (query && query.deleted !== undefined) {
            query.deleted = Number(query.deleted); // no booleans in dexie!
            q = dexieApi.db.recipes.where('deleted').equals(query.deleted)
                .and((o)=>!o.isShoppingList);
        } else if (query && query.savedRemote!==undefined) {
            console.log('Saved remote query!');
            q = dexieApi.db.recipes.where('savedRemote').equals(query.savedRemote&&1||0)
        } 
        if (!q) {
            return {
                result:[],
                count:0,
            }
        }
        if (sort) {
            // ok, we do our own pagination and sorting then...
            // risky? perhaps?
            let allTheResults = await q.toArray();
            allTheResults.sort(
                getSortFunction(sort)
            );
            let result = allTheResults.slice((page||0),(limit&&(page||0)+limit||undefined));
            let last = (result.length + (page||0) >= count)
            return {
                result,
                count : allTheResults.length,
                prevPage : page - (limit||result.length),
                nextPage : result.length + (page||0),
                currentPage : page||0,
                last
            }
        }
        let count
        if (q.alreadyCounted) {
            count = q.alreadyCounted
        } else {
            //else if (q.clone) {
            try {
                count = await q.clone().distinct().count()
            }
            //else {
            catch (err) {
                count = await q.count();
            }
        }
        if (page) {q = q.offset(page)}
        if (limit) {q = q.limit(limit)}
        let result = await q.toArray();
        let previousPage = 0;
        if (page && result.length) {
            previousPage = page - (limit||result.length)
        }
        let last = (result.length + (page||0) >= count)
        return {
            result,
            count,
            prevPage : previousPage,
            nextPage : result.length + (page||0),
            currentPage : page||0,
            last
        }
        
    },

    async updateRecipe (recipe) {
        return await dexieApi.db.recipes.put(prepRecLocal(recipe))
    },
    async updateRecipes (recipes) {
        return await dexieApi.db.recipes
            .bulkPut(
                recipes.map(prepRecLocal)
            );
    },
    async deleteRecipe (id) {
        if (id.id) {
            id = id.id; // accept object too
        }
        return await dexieApi.db.recipes.delete(id);
    }
}


function getSortFunction (sort) {
    if (typeof sort == 'function') {
        return sort
    } else {
        if (typeof sort == 'string') {
            return (a,b)=>a[sort]>b[sort]&&1||b[sort]>a[sort]&&-1||0
        } else if (sort.prop && sort.reverse) {
            return (a,b)=>b[sort.prop]>a[sort.prop]&&1||a[sort.prop]>b[sort.prop]&&-1||0
        } else if (sort.prop) {
            return getSortFunction(sort.prop)
        }
    }
}

export default dexieApi;
