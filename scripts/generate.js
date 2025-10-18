#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ProCheff Component Generator
const COMPONENTS_DIR = path.join(__dirname, '../src/components');

const templates = {
  component: (name, props = []) => `import { FC } from 'react'

interface ${name}Props {
${props.map(prop => `  ${prop.name}: ${prop.type}`).join('\n')}
}

const ${name}: FC<${name}Props> = ({ ${props.map(p => p.name).join(', ')} }) => {
  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-2xl font-bold">${name}</h2>
      {/* Component content */}
    </div>
  )
}

export default ${name}
`,

  page: (name) => `import { FC } from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '${name} | ProCheff',
  description: '${name} page for ProCheff application'
}

const ${name}Page: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">${name}</h1>
      
      <div className="space-y-6">
        {/* Page content */}
      </div>
    </div>
  )
}

export default ${name}Page
`,

  api: (name) => `import { NextRequest, NextResponse } from 'next/server'

/**
 * ${name} API endpoint
 * Handles ${name.toLowerCase()} operations for ProCheff
 */

export async function GET(request: NextRequest) {
  try {
    // GET logic here
    
    return NextResponse.json({
      success: true,
      data: null
    })
  } catch (error) {
    console.error('${name} GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // POST logic here
    
    return NextResponse.json({
      success: true,
      data: null
    })
  } catch (error) {
    console.error('${name} POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
`
};

function createComponent(type, name, options = {}) {
  let targetDir, fileName, content;
  
  switch (type) {
    case 'component':
      targetDir = path.join(COMPONENTS_DIR, options.category || 'ui');
      fileName = `${name}.tsx`;
      content = templates.component(name, options.props || []);
      break;
      
    case 'page':
      targetDir = path.join(__dirname, '../src/app', options.route || name.toLowerCase());
      fileName = 'page.tsx';
      content = templates.page(name);
      break;
      
    case 'api':
      targetDir = path.join(__dirname, '../src/app/api', options.route || name.toLowerCase());
      fileName = 'route.ts';
      content = templates.api(name);
      break;
      
    default:
      throw new Error(`Unknown type: ${type}`);
  }
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const filePath = path.join(targetDir, fileName);
  
  if (fs.existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }
  
  fs.writeFileSync(filePath, content);
  
  return filePath;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
🎯 ProCheff Component Generator

Usage:
  node scripts/generate.js <type> <name> [options]

Types:
  component  - React component
  page       - Next.js page
  api        - API route

Examples:
  node scripts/generate.js component MenuCard --category=menu
  node scripts/generate.js page Dashboard --route=admin/dashboard
  node scripts/generate.js api users --route=admin/users

Options:
  --category=<category>  Component category (for components)
  --route=<route>        Custom route path
  --props=<prop:type>    Component props (can be used multiple times)
    `);
    process.exit(1);
  }
  
  const [type, name] = args;
  const options = {};
  
  // Parse options
  args.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (key === 'props') {
        if (!options.props) options.props = [];
        const [propName, propType] = value.split(':');
        options.props.push({ name: propName, type: propType || 'string' });
      } else {
        options[key] = value;
      }
    }
  });
  
  try {
    const filePath = createComponent(type, name, options);
    console.log(`✅ Created ${type}: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createComponent, templates };
