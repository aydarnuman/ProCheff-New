#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ProCheff API Documentation Generator
const API_DIR = path.join(__dirname, '../src/app/api');

function scanApiRoutes(dir, routes = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanApiRoutes(filePath, routes);
    } else if (file === 'route.ts') {
      const relativePath = path.relative(API_DIR, dir);
      const endpoint = `/api/${relativePath}`;
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const methods = [];
        
        if (content.includes('export async function GET')) methods.push('GET');
        if (content.includes('export async function POST')) methods.push('POST');
        if (content.includes('export async function PUT')) methods.push('PUT');
        if (content.includes('export async function DELETE')) methods.push('DELETE');
        
        // Extract comments for description
        const descriptionMatch = content.match(/\/\*\*(.*?)\*\//s);
        const description = descriptionMatch ? 
          descriptionMatch[1].replace(/\s*\*\s*/g, ' ').trim() : 
          'No description available';
        
        routes.push({
          endpoint,
          methods,
          description,
          file: filePath
        });
      } catch (error) {
        console.warn(`Could not read ${filePath}: ${error.message}`);
      }
    }
  }
  
  return routes;
}

function generateMarkdown(routes) {
  let markdown = `# ProCheff API Documentation

Generated on: ${new Date().toISOString()}

## Available Endpoints

`;

  routes.forEach(route => {
    markdown += `### ${route.endpoint}\n\n`;
    markdown += `**Methods:** ${route.methods.join(', ')}\n\n`;
    markdown += `**Description:** ${route.description}\n\n`;
    
    // Add example usage for each method
    route.methods.forEach(method => {
      markdown += `#### ${method} Example\n`;
      markdown += '```http\n';
      
      if (method === 'GET') {
        markdown += `${method} http://localhost:3000${route.endpoint}\n`;
      } else {
        markdown += `${method} http://localhost:3000${route.endpoint}\n`;
        markdown += `Content-Type: application/json\n\n`;
        markdown += `{\n  "example": "data"\n}\n`;
      }
      
      markdown += '```\n\n';
    });
    
    markdown += '---\n\n';
  });
  
  // Add REST Client tests
  markdown += `## REST Client Tests

Copy the following to your \`.http\` file:

\`\`\`http
`;

  routes.forEach(route => {
    route.methods.forEach(method => {
      markdown += `### ${route.endpoint} - ${method}\n`;
      
      if (method === 'GET') {
        markdown += `${method} http://localhost:3000${route.endpoint}\n\n`;
      } else {
        markdown += `${method} http://localhost:3000${route.endpoint}\n`;
        markdown += `Content-Type: application/json\n\n`;
        markdown += `{\n  "example": "data"\n}\n\n`;
      }
    });
  });
  
  markdown += '```\n';
  
  return markdown;
}

function main() {
  console.log('📄 Generating ProCheff API Documentation...');
  
  if (!fs.existsSync(API_DIR)) {
    console.error('❌ API directory not found!');
    process.exit(1);
  }
  
  const routes = scanApiRoutes(API_DIR);
  
  if (routes.length === 0) {
    console.warn('⚠️  No API routes found!');
    return;
  }
  
  const markdown = generateMarkdown(routes);
  const outputPath = path.join(__dirname, '../API_DOCUMENTATION.md');
  
  fs.writeFileSync(outputPath, markdown);
  
  console.log(`✅ Documentation generated: ${outputPath}`);
  console.log(`📊 Found ${routes.length} API endpoints:`);
  
  routes.forEach(route => {
    console.log(`   ${route.methods.join(',')} ${route.endpoint}`);
  });
}

main();
