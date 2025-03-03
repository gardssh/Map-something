#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to the migration file
const migrationFile = path.join(__dirname, 'migrations', 'add_last_sync_to_strava_tokens.sql');

// Check if the migration file exists
if (!fs.existsSync(migrationFile)) {
	console.error('Migration file not found:', migrationFile);
	process.exit(1);
}

// Get the Supabase project ID and database URL from environment variables
const projectId = process.env.SUPABASE_PROJECT_ID;
const databaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!projectId && !databaseUrl) {
	console.error('Either SUPABASE_PROJECT_ID or SUPABASE_DATABASE_URL must be set');
	process.exit(1);
}

try {
	console.log('Running migration...');

	if (databaseUrl) {
		// Run the migration using psql
		const command = `psql "${databaseUrl}" -f "${migrationFile}"`;
		console.log(`Executing: ${command}`);
		execSync(command, { stdio: 'inherit' });
	} else {
		// Run the migration using Supabase CLI
		const command = `supabase db execute --project-ref ${projectId} -f "${migrationFile}"`;
		console.log(`Executing: ${command}`);
		execSync(command, { stdio: 'inherit' });
	}

	console.log('Migration completed successfully!');
} catch (error) {
	console.error('Error running migration:', error.message);
	process.exit(1);
}
