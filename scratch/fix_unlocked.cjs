const fs = require('fs');

const profilePath = 'c:/Users/ADMIN/Documents/New Website/trustbank/src/pages/dashboard/ProfilePage.tsx';
let content = fs.readFileSync(profilePath, 'utf-8');

// The user specifically wants firstName and lastName ALWAYS locked.
// All other sensitive fields locked ONLY if they have a value in DB.
const propToDb = {
    firstName: "true",
    lastName: "true",
    dateOfBirth: "isFieldLocked(profile?.date_of_birth)",
    nationality: "isFieldLocked(profile?.nationality)",
    phone: "isFieldLocked(profile?.phone)",
    mailingAddress: "isFieldLocked(profile?.mailing_address || profile?.address)",
    city: "isFieldLocked(profile?.city)",
    stateProvince: "isFieldLocked(profile?.state_province)",
    postalCode: "isFieldLocked(profile?.postal_code)",
    country: "isFieldLocked(profile?.country)",
    occupation: "isFieldLocked(profile?.occupation)",
    employerName: "isFieldLocked(profile?.employer_name)",
    govIdNumber: "isFieldLocked(profile?.gov_id_number)"
};

const inputRegex = /<Input readOnly=\{false\} className=\{\`([^\$]+)\$\{false \? "([^"]+)" : "([^"]*)"\}\`\} value=\{form\.([a-zA-Z0-9]+)\}([^>]*)\/>/g;
content = content.replace(inputRegex, (match, p1, p2, p3, prop, rest) => {
    const lockedCond = propToDb[prop];
    if (!lockedCond) return match; 
    return `<Input readOnly={${lockedCond}} className={\`${p1}\$\{${lockedCond} ? "${p2}" : "${p3}"}\`} value={form.${prop}}${rest}/>`;
});

fs.writeFileSync(profilePath, content, 'utf-8');
console.log("Fixed falsely unlocked fields and permanently locked First/Last Name.");
