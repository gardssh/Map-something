import { chromium } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CabinFeature {
  type: 'Feature';
  properties: {
    name: string;
    operator: string;
    ut_url_id?: string;
    [key: string]: any;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface CabinCollection {
  type: 'FeatureCollection';
  features: CabinFeature[];
}

interface Link {
  href: string;
  text: string;
}

// Helper function to normalize text for comparison
function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, ''); // Remove special chars
}

async function findUtId(page: any, cabin: CabinFeature): Promise<string | null> {
  try {
    // Navigate to ut.no
    await page.goto('https://ut.no');
    
    // Handle cookie popup if it appears
    try {
      await page.waitForSelector('button:has-text("Aksepter alt")', { timeout: 5000 });
      await page.click('button:has-text("Aksepter alt")');
      await page.waitForTimeout(1000); // Wait for popup to disappear
    } catch (e) {
      // Cookie popup might not appear if already accepted
      console.log('No cookie popup found or already accepted');
    }
    
    // Wait for and click the search input
    await page.waitForSelector('input[placeholder="Hvor vil du på tur?"]');
    await page.click('input[placeholder="Hvor vil du på tur?"]');
    
    // Type the cabin name and wait for results
    await page.keyboard.type(cabin.properties.name);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000); // Wait for search results
    
    // Wait for and find the cabin links in the specific section
    try {
      // Wait for the cabin list section using XPath
      const cabinListSelector = 'article div section div:nth-child(4) ul';
      await page.locator(cabinListSelector).waitFor({ timeout: 5000 });
      
      // Scroll to make sure the section is visible
      await page.evaluate(() => {
        window.scrollBy(0, 500);
      });
      await page.waitForTimeout(500);
      
      // Find all cabin links within this section
      const links = await page.locator(`${cabinListSelector} a`).evaluateAll((elements: HTMLAnchorElement[]) => {
        return elements.map(el => ({
          href: el.getAttribute('href') || '',
          text: el.textContent?.trim() || ''
        }));
      }) as Link[];

      const normalizedCabinName = normalizeText(cabin.properties.name);
      console.log(`Looking for cabin: ${cabin.properties.name} (normalized: ${normalizedCabinName})`);
      console.log(`Found ${links.length} potential cabin links`);
      
      // Filter links to only include those with /hytte/ in the URL
      const cabinLinks = links.filter((link: Link) => link.href.includes('/hytte/'));
      console.log(`Found ${cabinLinks.length} actual cabin links`);
      
      for (const link of cabinLinks) {
        console.log(`Checking cabin link: ${link.text} (normalized: ${normalizeText(link.text)})`);
        
        const normalizedLinkText = normalizeText(link.text);
        // Check if the normalized texts match
        if (normalizedLinkText === normalizedCabinName || 
            normalizedLinkText.includes(normalizedCabinName) || 
            normalizedCabinName.includes(normalizedLinkText)) {
          // Extract the ID from href
          const utId = link.href?.split('/').pop();
          if (utId && !isNaN(Number(utId))) {
            console.log(`Found ID ${utId} for ${cabin.properties.name} (matched with "${link.text}")`);
            return utId;
          }
        }
      }
      
      console.log(`No matching link found for ${cabin.properties.name}`);
      return null;
    } catch (error) {
      console.error(`Error finding cabin link for ${cabin.properties.name}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`Error finding ID for ${cabin.properties.name}:`, error);
    return null;
  }
}

async function main() {
  // Read the cabin data
  const cabinDataPath = path.join(process.cwd(), 'src', 'data', 'dnt-cabins.json');
  const cabinData = JSON.parse(await fs.readFile(cabinDataPath, 'utf-8')) as CabinCollection;
  
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let updatedCount = 0;
  
  // Process each cabin
  for (const cabin of cabinData.features) {
    // Skip if already has ut_url_id
    if (cabin.properties.ut_url_id) {
      console.log(`Skipping ${cabin.properties.name} - already has ID ${cabin.properties.ut_url_id}`);
      continue;
    }
    
    const utId = await findUtId(page, cabin);
    if (utId) {
      cabin.properties.ut_url_id = utId;
      updatedCount++;
    }
    
    // Save after each successful update
    if (utId) {
      await fs.writeFile(cabinDataPath, JSON.stringify(cabinData, null, 2));
      console.log(`Saved updated data with ID for ${cabin.properties.name}`);
    }
  }
  
  await browser.close();
  
  console.log(`\nSummary:`);
  console.log(`Total cabins processed: ${cabinData.features.length}`);
  console.log(`Cabins updated with new IDs: ${updatedCount}`);
}

main().catch(console.error); 