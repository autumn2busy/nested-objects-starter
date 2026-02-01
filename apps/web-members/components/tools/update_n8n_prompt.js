const fs = require('fs');
const path = 'c:\\Users\\Mother\\Projects\\nested-objects-starter\\apps\\web-members\\components\\tools\\n8nchatjson.json';

try {
    const fileContent = fs.readFileSync(path, 'utf8');
    const workflow = JSON.parse(fileContent);

    const llmNode = workflow.nodes.find(n => n.name === 'Call Groq AI1');
    if (llmNode) {
        const systemPrompt = `You are the expert Field Services Concierge for Nested Objects.

YOUR AUDIENCE:
You strictly serve Independent Field Inspectors, Occupancy Inspectors, Mortgage Field Service Workers, Notaries, and Property Preservation Specialists. 
You do NOT serve Home Inspectors (Real Estate/Buyer Inspections) or Municipal Code Inspectors. 
If asked about "Home Inspections" (ASHI/NACHI/Buyer Reports), POLITELY CLARIFY that you specialize in Field Services (Bank/Lender/Insurance work) and steer the conversation back to that.

YOUR ROLE:
Provide actionable, direct advice on:
- Validating and finding Field Service Firms (Regional & National vendors).
- navigating industry requirements (background checks, E&O insurance, Aspen Grove numbers).
- Pricing and pay structures for field tasks (rush fees, occupancy checks, insurance loss control).
- Routing and efficiency for high-volume gig work.

FORMATTING RULES:
- Use Markdown for all formatting.
- Use **Bold** for key terms and emphasis.
- Use Bullet points for lists.
- Keep paragraphs short and scannable.
- NEVER produce large walls of text.

TONE:
- Professional, concise, "in-the-know" industry veteran.
- Encourage efficiency and business growth.
`;

        // The JSON body in the node is a string that contains n8n variable syntax
        // We need to carefully replace the system content without breaking the JSON structure inside the string

        // Parse the inner JSON string if possible, or just replace the content 
        // The current value is:
        // "={\n  \"model\": \"llama-3.3-70b-versatile\",\n  \"messages\": [\n    {\n      \"role\": \"system\",\n      \"content\": \"You are an...\"\n    },\n    {\n      \"role\": \"user\",\n      \"content\": \"{{ $json.prompt }}\"\n    }\n  ],\n  \"temperature\": 0.7,\n  \"max_tokens\": 1000\n}"

        let jsonBody = llmNode.parameters.jsonBody.substring(1); // Remove leading =
        try {
            let bodyObj = JSON.parse(jsonBody);
            bodyObj.messages[0].content = systemPrompt;
            llmNode.parameters.jsonBody = "=" + JSON.stringify(bodyObj, null, 2);
            console.log("Updated system prompt successfully.");
        } catch (parseErr) {
            console.error("Error parsing inner JSON body: " + parseErr.message);
            // Fallback or manual replace?
            // Let's rely on valid JSON structure being there.
        }
    }

    fs.writeFileSync(path, JSON.stringify(workflow, null, 4), 'utf8');

} catch (e) {
    console.error(e.message);
}
