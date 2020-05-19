import {getInAConversion,getMultiplierConversion,
        getStandardUnit,parseUnit,UNIT_REGEXP} from './unitAmounts.js';

it(
    'unit regex',
    ()=>{
        let m = 'cups'.match(UNIT_REGEXP)
        expect(
            m
        ).toBeTruthy()
        console.log('Got match',m)
        expect(
            m.groups
        ).toBeDefined()
        expect(
            m.groups.unit
        ).toEqual('cups')
    }
);

it(
    'parseUnit',
    ()=>{
        expect(parseUnit('cups milk')).toEqual(
            expect.objectContaining(
                {
                    unit : 'cups',
                    text : 'milk'
                }
            )
        );
        expect(parseUnit('eggs, hard-boiled')).toEqual(
            expect.objectContaining(
                {
                    text : 'eggs, hard-boiled'
                }
            )
        );
    }
    
);

it(
    'standardize units',
    ()=>{
        expect(getStandardUnit('tsp')).toEqual('tsp');
        expect(getStandardUnit('teaspoon')).toEqual('tsp');
        expect(getStandardUnit('t')).toEqual('tsp');
        expect(getStandardUnit('Tbs')).toEqual('Tbs');
        expect(getStandardUnit('T')).toEqual('Tbs');
        expect(getStandardUnit('grams')).toEqual('g');
        expect(getStandardUnit('milligrams')).toEqual('mg');
        expect(getStandardUnit('shmorgashborg')).toBeUndefined();
    }
);

it(
    'conversions',
    ()=>{
        expect(getInAConversion('tsp','tablespoons')).toBeCloseTo(3)
        expect(getInAConversion('ounce','pound')).toBeCloseTo(16)
        expect(getInAConversion('pound','ounce')).toBeCloseTo(1/16)
        expect(getInAConversion('cup','fl oz')).toBeCloseTo(1/8)
        expect(getInAConversion('oz','cup',0.5)).toBeCloseTo(4.15,0.2)
        expect(getInAConversion('g','ml',1)).toBeCloseTo(1)
        expect(getInAConversion('g','ml',0.5)).toBeCloseTo(0.5)
        expect(getInAConversion('ml','g',0.5)).toBeCloseTo(2)
        expect(getInAConversion('oz','cup',1)).toBeCloseTo(8.3,0.2)
        expect(getInAConversion('ml','g',0.5)).toBeCloseTo(2)
        expect(getMultiplierConversion(
            't','T'
        )).toBeCloseTo(0.33333);
        expect(getMultiplierConversion(
            'c','fl oz'
        )).toBeCloseTo(8);
    }
);