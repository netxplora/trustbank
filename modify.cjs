const fs = require('fs');
const content = fs.readFileSync('supabase/migrations/all_migrations_combined.sql', 'utf8');

const rpcs = [
  'process_transfer',
  'process_international_wire',
  'process_bill_payment',
  'process_loan_repayment',
  'clear_all_debt',
  'process_card_fee',
  'fund_brokerage_account',
  'process_trade'
];

let sqlOutput = '-- ============================================================\n-- Phase 2: Transaction PIN Enforcement\n-- ============================================================\n\n';

for (const rpc of rpcs) {
  // Find the LAST occurrence of the function definition
  const regexString = 'CREATE OR REPLACE FUNCTION public\\.' + rpc + '\\s*\\(.*?\\)\\s*RETURNS\\s*.*?\\s*AS\\s*\\$\\$';
  const regex = new RegExp(regexString, 'gsi');
  let match;
  let lastMatch = null;
  while ((match = regex.exec(content)) !== null) {
    lastMatch = match;
  }
  
  if (lastMatch) {
    const startIndex = lastMatch.index;
    const endIndex = content.indexOf('$$ LANGUAGE plpgsql SECURITY DEFINER;', startIndex);
    if (endIndex === -1) {
       console.log('Could not find end of ' + rpc);
       continue;
    }
    
    let originalBody = content.substring(startIndex, endIndex + 37);
    
    // Modify parameters to add p_pin TEXT
    // Match up to the closing parenthesis of parameters
    const paramRegex = /(CREATE OR REPLACE FUNCTION public\.\w+\s*\()(.*?)(\)\s*RETURNS)/s;
    const pMatch = originalBody.match(paramRegex);
    if (pMatch) {
      let params = pMatch[2].trim();
      if (params === '') {
        params = 'p_pin TEXT';
      } else {
        params += ',\n  p_pin TEXT';
      }
      originalBody = originalBody.replace(paramRegex, '$1' + params + '$3');
    }
    
    // Determine the user variable to verify against
    let userVar = 'p_user_id';
    let injectionPoint = 'BEGIN';
    let injectionCode = `
  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(p_user_id, p_pin);
`;

    if (rpc === 'process_loan_repayment' || rpc === 'clear_all_debt') {
      userVar = 'v_user_id';
      // Find where v_user_id := auth.uid(); happens and inject AFTER the null check
      injectionPoint = "RAISE EXCEPTION 'Not authenticated';\n  END IF;";
      injectionCode = `
  IF p_pin IS NULL OR trim(p_pin) = '' THEN
    RAISE EXCEPTION 'Transaction PIN is required';
  END IF;
  PERFORM public.verify_transaction_pin_internal(v_user_id, p_pin);
`;
    }

    originalBody = originalBody.replace(injectionPoint, injectionPoint + '\n' + injectionCode);
    
    sqlOutput += originalBody + '\n\n';
  } else {
    console.log('Could not find ' + rpc);
  }
}

fs.writeFileSync('supabase/migrations/20260801000001_transaction_pin_enforcement.sql', sqlOutput, 'utf8');
console.log('Successfully wrote migration.');
