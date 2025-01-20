import { chromium } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CabinLink {
  name: string;
  region: string;
  url: string;
}

interface CabinLinkCollection {
  total: number;
  links: CabinLink[];
  lastUpdated: string;
}

async function gatherCabinUrls(): Promise<CabinLinkCollection> {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to the cabins page
  await page.goto('https://ut.no/utforsker/norge/hytter');
  
  // Handle cookie consent
  try {
    await page.waitForSelector('button:has-text("Aksepter alt")', { timeout: 5000 });
    await page.click('button:has-text("Aksepter alt")');
    console.log('Accepted cookies');
    await page.waitForTimeout(1000); // Wait for popup to disappear
  } catch (error) {
    console.log('No cookie popup found or already accepted');
  }
  
  const links: CabinLink[] = [];
  let hasMore = true;
  let previousLength = 0;
  
  // Keep clicking "Last inn flere hytter" until all cabins are loaded
  while (hasMore) {
    try {
      // Wait for cabin cards to be visible
      await page.waitForSelector('ul.explore-items__list li.explore-items__object', { timeout: 30000 });
      
      // Get current list of cabins
      const currentLinks = await page.evaluate(() => {
        const cabinElements = document.querySelectorAll('ul.explore-items__list li.explore-items__object div.simple-card.cabin-card');
        return Array.from(cabinElements).map((card) => {
          const link = card.querySelector('a');
          if (!link) return null;

          // The region is in a div above the link
          const region = card.querySelector('div:first-child')?.textContent?.trim() || '';
          
          // The name is in the link text
          const name = link.textContent?.trim() || '';
          
          return {
            name,
            region,
            url: (link as HTMLAnchorElement).href
          };
        }).filter((item): item is CabinLink => item !== null); // Type guard to ensure non-null
      });

      // Create a Set of URLs we already have
      const existingUrls = new Set(links.map(l => l.url));
      
      // Filter out duplicates before adding to links array
      const newLinks = currentLinks.filter(link => !existingUrls.has(link.url));
      
      // If we didn't find any new links, we're probably done
      if (newLinks.length === 0) {
        console.log('No new cabins found, stopping');
        hasMore = false;
        break;
      }

      links.push(...newLinks);
      console.log(`Found ${newLinks.length} new cabins (total: ${links.length})`);
      
      // Click the "Last inn flere hytter" button if visible
      const loadMoreButton = await page.locator('button:has-text("Last inn flere hytter")');
      const isVisible = await loadMoreButton.isVisible();
      
      if (isVisible) {
        await loadMoreButton.click();
        // Wait longer for the new content to load
        await page.waitForTimeout(2000);
        // Wait for network to be idle to ensure content is loaded
        await page.waitForLoadState('networkidle');
      } else {
        console.log('No more "Last inn flere hytter" button found');
        hasMore = false;
      }
    } catch (error) {
      console.error('Error while loading more cabins:', error);
      hasMore = false;
    }
  }

  // No need for duplicate removal at the end since we're handling it in the loop
  return {
    total: links.length,
    links,
    lastUpdated: new Date().toISOString()
  };
}

async function main() {
  try {
    console.log('Starting to gather cabin URLs...');
    const cabinLinks = await gatherCabinUrls();
    
    // Save to file
    const outputPath = path.join(process.cwd(), 'src', 'data', 'cabin-links.json');
    await fs.writeFile(outputPath, JSON.stringify(cabinLinks, null, 2));
    
    console.log(`\nSummary:`);
    console.log(`Total unique cabins found: ${cabinLinks.total}`);
    console.log(`Data saved to: ${outputPath}`);
  } catch (error) {
    console.error('Failed to gather cabin URLs:', error);
    process.exit(1);
  }
}

main(); 