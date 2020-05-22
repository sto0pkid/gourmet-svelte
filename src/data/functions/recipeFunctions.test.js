import deepcopy from 'deepcopy';
import recipeFunctions from './recipeFunctions.js';
import {testRecs} from '../../common/mocks/recipes.js';
import user,{otherUser} from '../../common/mocks/user.js';
import {setupDBwithRecs} from './setupMockDB.js'

let event = {};
let context = {}

let bp = [event,context,user] // boilerplate lambda function mumbo jumbo
console.log('Connecting to URL?',process.env.MONGO_URL)
it(
    "add recipe returns new _ID. Get Recipe returns that recipe",
    async ()=> {
        let recipe = await recipeFunctions.addRecipe(...bp,{
            recipe:deepcopy(testRecs.standard)
        });
        expect(recipe).toBeDefined();
        expect(recipe._id).toBeDefined();
        expect(recipe.owner.email).toBeDefined();
        expect(recipe.owner.email).toEqual(user.email)
        expect(recipe.title).toEqual(testRecs.standard.title);
        expect(recipe.ingredients.length).toEqual(testRecs.standard.ingredients.length);
        let fetchedRec = await recipeFunctions.getRecipe(
            ...bp,
            {_id:recipe._id}
        );
        expect(fetchedRec.title).toEqual(testRecs.standard.title);
        expect(fetchedRec.localid).toEqual(testRecs.standard.localid);
        expect(fetchedRec._id).toEqual(recipe._id);
    }
)

it(
    'updateRecipe',
    async ()=> {
        let r = deepcopy(testRecs.standard)
        let recipe = await recipeFunctions.addRecipe(...bp,{recipe:r});
        recipe.ingredients.push(
            testRecs.testIngredient
        );
        recipe.ingredients.push(
            testRecs.testIngredient
        );
        recipe.title += ' test change'
        let modifiedRecipe = await recipeFunctions.updateRecipe(...bp,
                                                              {recipe});
        expect(modifiedRecipe._id).toEqual(recipe._id);
        expect(modifiedRecipe.title).toEqual(testRecs.standard.title+' test change');
        expect(modifiedRecipe.ingredients.length).toBeGreaterThan(
            testRecs.standard.ingredients.length
        );
    }
);

it(
    "enforce user's only modify own data",
    async () => {
        let rec = await recipeFunctions.addRecipe(...bp,{recipe:{title:'Private Recipe'}});
        expect(async ()=>await recipeFunctions.getRecipe(...bp,{_id:rec._id}))
            .not
            .toThrowError();
        let threwError = false;
        try {
            let stolenRec = await recipeFunctions.getRecipe(event,context,otherUser,
                                                            {_id:rec._id});
            console.log('I stole the cookie jar: ',stolenRec);
        }
        catch (err) {
            threwError = err;
            expect(err.message).toMatch(/no recipe/i)
        }
        expect(threwError).toBeTruthy()
        let origRecId = rec._id
        threwError = false;
        try {
            let muckedUpRec = await recipeFunctions.updateRecipe(
                event,context,otherUser,
                {recipe:rec}
            );
        } catch (err) {
            // Update of one we don't find should just push a new recipe in
            threwError = true;
        }
        if (!threwError) {
            expect(muckedUpRec._id).not.toEqual(origRecId)
        } 
        try {
            let deletedOtherPersonsRecipes = await recipeFunctions.deleteRecipe(
            event,context,otherUser,
                {_id:rec._id}
            );
            expect(deletedOtherPersonsRecipes).toEqual(0)
        }
        catch (err) {
            expect(err.message).toMatch(/no\s*recipe/i);
        }

    }
);

async function expectError (f) {
    try {
        await f()
    }
    catch (e) {
        return e
    }
    expect('Error').toEqual('have been thrown');
}

it('nice errors',
   async () => {
       let e = await expectError(
           async ()=>await recipeFunctions.getRecipe(...bp,{recipe:{title:'foo'}})
       );
       expect(e.message).toMatch(/foo/) // should report what parameters we passed with
       expect(e.message).toMatch(/_id/) // should report what parameters were needed
       let e2 = await expectError(
           async ()=>await recipeFunctions.updateRecipe(...bp,{recipe:{title:'foo'}})
       );
       expect(e2.message).toMatch(/foo/) // should report what parameters we passed with
       expect(e2.message).toMatch(/_id/) // should report what parameters were needed
   }
  );


it(
    'delete recipe',
    async () => {
        let rec = await recipeFunctions.addRecipe(...bp,{recipe:{title:'Bad Recipe'}});
        let id = rec._id;
        let gotItBack = await recipeFunctions.getRecipe(...bp,{_id:id});
        expect(gotItBack._id).toEqual(id);
        let deleteCount = await recipeFunctions.deleteRecipe(...bp,{_id:id});
        expect(deleteCount).toEqual(1)
        let err = await expectError(
            async ()=>{
                let backFromTheDead = await recipeFunctions.getRecipe(...bp,{_id:id});
                console.log('VERY BAD: GOT REC BACK FROM THE DEAD',backFromTheDead)
            }
        );
        expect(err.message).toMatch(/no\s*recipe/i)
    }
);

describe('pagination', ()=>{

    beforeAll(async ()=>{
        await setupDBwithRecs(user);
    }
             );
    
    it(
        'pagination',
        async () => {
            let result = await recipeFunctions.getRecipes(
                ...bp,
                {limit:10})
            expect(result).toBeDefined();
            expect(result.count).toBeDefined()
            expect(result.page).toBeDefined()
            expect(result.result).toBeDefined()
            expect(result.result.length).toEqual(10);
            let nextResult = await recipeFunctions.getRecipes(
                ...bp,
                {limit:10,page:result.page}
            );
            expect(result.result.indexOf(nextResult.result[0])).toEqual(
                -1
            );
            let lastPage = result.count - 1;
            let lastResults = await recipeFunctions.getRecipes(
                ...bp,
                {limit:10,page:lastPage}
            );
            expect(lastResults.result.length).toBeLessThan(10);
        }
    );
})
// TODO:
// confirm getRecipes only gets you your own recipes
// test some queries? 
