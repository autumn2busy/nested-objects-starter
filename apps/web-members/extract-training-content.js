const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const crypto = require('crypto');

const TRAINING_DIR = path.join(__dirname, 'public/training');
const CSV_PATH = path.join(TRAINING_DIR, 'youtube links - Sheet1.csv');
const OUTPUT_FILE = path.join(__dirname, 'seed_training_content.sql');

// Helper to generate UUIDs
function generateUUID() {
    return crypto.randomUUID();
}

// Helper to escape SQL strings
function escapeSQL(str) {
    if (!str) return 'NULL';
    return "'" + str.replace(/'/g, "''").replace(/\0/g, "") + "'";
}

// Helper: Parse CSV
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
    const map = {}; // module_number -> youtube_url
    lines.forEach(line => {
        // Format: module 1,,url
        const parts = line.split(',');
        if (parts.length >= 3) {
            const name = parts[0].toLowerCase().trim(); // "module 1"
            const url = parts[2].trim();
            const match = name.match(/module\s+(\d+)/);
            if (match && url.startsWith('http')) {
                map[match[1]] = url;
            }
        }
    });
    return map;
}

async function processModule(moduleDirName, youtubeMap) {
    const moduleNum = parseInt(moduleDirName.replace('module-', ''));
    if (isNaN(moduleNum)) return null;

    const dirPath = path.join(TRAINING_DIR, moduleDirName);
    const files = fs.readdirSync(dirPath);

    // 1. Create Module Record
    const moduleId = generateUUID();
    let title = `Module ${moduleNum}`;
    let description = "Comprehensive training module.";
    let icon = "📚"; // Default

    // Try to find Overview doc for better title/desc
    const overviewFile = files.find(f => f.toLowerCase().includes('overview') && f.endsWith('.docx'));
    if (overviewFile) {
        // Extract text
        const result = await mammoth.extractRawText({ path: path.join(dirPath, overviewFile) });
        const text = result.value.trim();
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) description = lines.slice(0, 3).join(' '); // First few lines
    }

    const youtubeUrl = youtubeMap[moduleNum] || null;

    console.log(`Processing Module ${moduleNum}...`);

    const sqlStatements = [];
    sqlStatements.push(`
    -- Module ${moduleNum}
    INSERT INTO public.training_modules (id, module_number, title, description, icon, estimated_hours)
    VALUES (${escapeSQL(moduleId)}, ${moduleNum}, ${escapeSQL(title)}, ${escapeSQL(description)}, ${escapeSQL(icon)}, 1)
    ON CONFLICT DO NOTHING;
    `);

    // 2. Process Lessons
    // Strategy: Look for "Lesson Content.docx" or similar.
    // If found, try to split. If not, look for PDF lessons.
    const lessonDoc = files.find(f => (f.toLowerCase().includes('lesson') || f.toLowerCase().includes('content')) && f.endsWith('.docx'));

    if (lessonDoc) {
        // Process DOCX lesson
        const { value: html } = await mammoth.convertToHtml({ path: path.join(dirPath, lessonDoc) });
        // Naive split by <h1> or <h2>? 
        // For simplicity in this script, we'll create ONE big lesson for the whole doc if we can't easily split,
        // OR we can assign it as Lesson 1.
        // Let's create one lesson per DOCX found? 
        // Ideally we'd split, but regex on HTML is fragile.
        // Let's just make it "Lesson 1: Core Concepts" containing the whole doc.

        const lessonId = generateUUID();
        sqlStatements.push(`
        INSERT INTO public.training_lessons (id, module_id, lesson_number, title, content, content_type, video_url)
        VALUES (
            ${escapeSQL(lessonId)}, 
            ${escapeSQL(moduleId)}, 
            1, 
            'Core Concepts', 
            ${escapeSQL(html)}, 
            'text', 
            ${escapeSQL(youtubeUrl)}
        );
        `);
    } else {
        // No DOCX lesson found. Check for PDF "Lessons"
        const lessonPdf = files.find(f => f.toLowerCase().includes('lesson') && f.endsWith('.pdf'));
        if (lessonPdf) {
            // Create a placeholder lesson
            const lessonId = generateUUID();
            sqlStatements.push(`
            INSERT INTO public.training_lessons (id, module_id, lesson_number, title, content, content_type, video_url)
            VALUES (
                ${escapeSQL(lessonId)}, 
                ${escapeSQL(moduleId)}, 
                1, 
                'Module Materials', 
                'Please review the attached PDF lesson materials.', 
                'pdf', 
                ${escapeSQL(youtubeUrl)}
            );
            `);
            // Add the PDF itself as a resource linked to this lesson ?? 
            // Logic below handles resources generally.
        } else {
            // Fallback: Just a video lesson?
            if (youtubeUrl) {
                const lessonId = generateUUID();
                sqlStatements.push(`
                INSERT INTO public.training_lessons (id, module_id, lesson_number, title, content, content_type, video_url)
                VALUES (
                    ${escapeSQL(lessonId)}, 
                    ${escapeSQL(moduleId)}, 
                    1, 
                    'Video Training', 
                    'Watch the video to complete this module.', 
                    'video', 
                    ${escapeSQL(youtubeUrl)}
                );
                `);
            }
        }
    }

    // 3. Process Resources (All other files)
    // Filter out the ones we already consumed (overview, lesson doc)
    const resourceFiles = files.filter(f => f !== overviewFile && f !== lessonDoc);

    for (const file of resourceFiles) {
        if (['.jpg', '.png', '.pdf', '.docx', '.xlsx', '.mp4', '.m4a'].includes(path.extname(file).toLowerCase())) {
            const resourceId = generateUUID();
            const filePath = `/training/${moduleDirName}/${file}`;
            const fileType = path.extname(file).replace('.', '');

            // Heuristic to link to Lesson 1 (since we mostly make 1 lesson per module for now)
            // In a better parser we'd match "Lesson 1" in filename.

            sqlStatements.push(`
            INSERT INTO public.training_resources (id, module_id, title, description, file_path, file_type)
            VALUES (
                ${escapeSQL(resourceId)}, 
                ${escapeSQL(moduleId)}, 
                ${escapeSQL(file)}, 
                'Reference material', 
                ${escapeSQL(filePath)}, 
                ${escapeSQL(fileType)}
            );
            `);
        }
    }

    return sqlStatements.join('\n');
}

async function main() {
    console.log("Starting extraction...");
    if (!fs.existsSync(OUTPUT_FILE)) {
        fs.writeFileSync(OUTPUT_FILE, '-- Generated Seed Data\n');
    }

    const youtubeMap = parseCSV(CSV_PATH);
    const dirs = fs.readdirSync(TRAINING_DIR).filter(f => f.startsWith('module-'));

    const allSql = [];

    // Sort modules 1-8
    dirs.sort((a, b) => {
        return parseInt(a.replace('module-', '')) - parseInt(b.replace('module-', ''));
    });

    for (const dir of dirs) {
        const sql = await processModule(dir, youtubeMap);
        if (sql) allSql.push(sql);
    }

    fs.appendFileSync(OUTPUT_FILE, allSql.join('\n'));
    console.log(`Done! SQL written to ${OUTPUT_FILE}`);
}

main().catch(console.error);
