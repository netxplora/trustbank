const fs = require('fs');

const profilePath = 'c:/Users/ADMIN/Documents/New Website/trustbank/src/pages/dashboard/ProfilePage.tsx';
let content = fs.readFileSync(profilePath, 'utf-8');

const propToDb = {
    firstName: "profile?.first_name",
    lastName: "profile?.last_name",
    dateOfBirth: "profile?.date_of_birth",
    gender: "profile?.gender",
    nationality: "profile?.nationality",
    phone: "profile?.phone",
    mailingAddress: "(profile?.mailing_address || profile?.address)",
    city: "profile?.city",
    stateProvince: "profile?.state_province",
    postalCode: "profile?.postal_code",
    country: "profile?.country",
    occupation: "profile?.occupation",
    employerName: "profile?.employer_name",
    annualIncomeRange: "profile?.annual_income_range",
    sourceOfFunds: "profile?.source_of_funds",
    govIdType: "profile?.gov_id_type",
    govIdNumber: "profile?.gov_id_number",
    preferredLanguage: "profile?.preferred_language",
    preferredCurrency: "profile?.preferred_currency"
};

// Replace all lingering isLocked occurrences for Inputs
const inputRegex = /<Input readOnly=\{isLocked\} className=\{\`([^\$]+)\$\{isLocked \? "([^"]+)" : "([^"]*)"\}\`\} value=\{form\.([a-zA-Z0-9]+)\}([^>]*)\/>/g;
content = content.replace(inputRegex, (match, p1, p2, p3, prop, rest) => {
    const dbProp = propToDb[prop];
    if (!dbProp) return match; 
    const lockedCond = `isFieldLocked(${dbProp})`;
    return `<Input readOnly={${lockedCond}} className={\`${p1}\$\{${lockedCond} ? "${p2}" : "${p3}"}\`} value={form.${prop}}${rest}/>`;
});

// Any remaining isLocked should just be handled or removed. 
// For emails, they are manually disabled. Let's see if there are any other `isLocked` left.
content = content.replace(/isLocked/g, "false");

fs.writeFileSync(profilePath, content, 'utf-8');
console.log("Fixed remaining isLocked references.");
