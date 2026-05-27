/**
 * Sample Data Generator for EG-Maps
 * Generates 12,000+ entities for performance testing
 * Run: npx tsx scripts/generate-sample-data.ts
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

interface SpeciesEntity {
  id: string
  name: string
  scientificName: string
  category: string
  conservationStatus: 'EX' | 'EW' | 'CR' | 'EN' | 'VU' | 'NT' | 'LC'
  latitude: number
  longitude: number
  population: number
  habitat: string
  imageUrl: string
  redBookUrl: string
}

interface ProjectEntity {
  id: string
  name: string
  region: string
  country: string
  latitude: number
  longitude: number
  beneficiaries: number
  funding: number
  status: 'active' | 'completed' | 'planned'
  category: string
  description: string
}

// Species data templates
const speciesCategories = [
  { name: 'Mammals', species: ['African Elephant', ' Bengal Tiger', 'Giant Panda', 'Polar Bear', 'Mountain Gorilla', 'Blue Whale', 'Snow Leopard', 'Koala', 'Red Panda', 'Chimpanzee', 'Orangutan', 'Wolf', 'Lion', 'Cheetah', 'Jaguar'] },
  { name: 'Birds', species: ['California Condor', 'Snowy Owl', 'Peregrine Falcon', 'Kakapo', 'Philippine Eagle', 'Whooping Crane', 'Northern Spotted Owl', 'Golden Eagle', 'Albatross', 'Penguin'] },
  { name: 'Reptiles', species: ['Sea Turtle', 'Komodo Dragon', 'Galapagos Tortoise', 'Crocodile', 'Iguana', 'Python', 'Cobra', 'Tortoise', 'Lizard', 'Gecko'] },
  { name: 'Fish', species: ['Bluefin Tuna', 'Atlantic Salmon', 'Shark', 'Sturgeon', 'Cod', 'Halibut', 'Swordfish', 'Marlin', 'Manta Ray', 'Seahorse'] },
  { name: 'Insects', species: ['Monarch Butterfly', 'Honeybee', 'Dragonfly', 'Beetle', 'Moth', 'Ant', 'Wasp', 'Grasshopper', 'Ladybug', 'Firefly'] },
  { name: 'Amphibians', species: ['Poison Dart Frog', 'Salamander', 'Axolotl', 'Frog', 'Toad', 'Newt', 'Tree Frog', 'Bullfrog', 'Cane Toad', 'Panama Gold Frog'] }
]

const habitats = [
  'Tropical Rainforest', 'Temperate Forest', 'Boreal Forest', 'Savanna', 
  'Grassland', 'Desert', 'Tundra', 'Wetlands', 'Coral Reefs', 'Mountains',
  'Oceans', 'Rivers', 'Lakes', 'Caves', 'Coastal Areas'
]

const scientificSuffixes = ['ensis', 'us', 'i', 'ae', 'tus', 'rus', 'lis', 'nis', 'tus', 'ix']

// Project data templates
const projectRegions = [
  { region: 'Africa', countries: ['Kenya', 'South Africa', 'Tanzania', 'Nigeria', 'Ethiopia', 'Uganda', 'Ghana', 'Madagascar', 'Mozambique', 'Zimbabwe'] },
  { region: 'Asia', countries: ['India', 'China', 'Indonesia', 'Thailand', 'Vietnam', 'Malaysia', 'Philippines', 'Japan', 'South Korea', 'Nepal'] },
  { region: 'Europe', countries: ['Germany', 'France', 'Spain', 'Italy', 'UK', 'Poland', 'Romania', 'Sweden', 'Norway', 'Greece'] },
  { region: 'North America', countries: ['USA', 'Canada', 'Mexico', 'Guatemala', 'Cuba', 'Jamaica', 'Costa Rica', 'Panama', 'Honduras', 'Nicaragua'] },
  { region: 'South America', countries: ['Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Ecuador', 'Venezuela', 'Bolivia', 'Paraguay', 'Uruguay'] },
  { region: 'Oceania', countries: ['Australia', 'New Zealand', 'Papua New Guinea', 'Fiji', 'Samoa', 'Tonga', 'Solomon Islands', 'Vanuatu', 'Kiribati', 'Micronesia'] }
]

const projectCategories = [
  'Habitat Protection', 'Species Conservation', 'Community Education', 
  'Research & Monitoring', 'Anti-Poaching', 'Reforestation',
  'Marine Protection', 'Wetland Restoration', 'Sustainable Agriculture', 'Wildlife Corridors'
]

const statuses: Array<'active' | 'completed' | 'planned'> = ['active', 'active', 'active', 'completed', 'planned']

// Random helper functions
function random(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1))
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateScientificName(name: string): string {
  const parts = name.toLowerCase().split(' ')
  const genus = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  const species = parts[1] || parts[0]
  return `${genus} ${species}${randomChoice(scientificSuffixes)}`
}

function generateLatLng(continent: string): [number, number] {
  const bounds: Record<string, [number, number, number, number]> = {
    'Africa': [-35, 35, -18, 50],
    'Asia': [-10, 55, 60, 150],
    'Europe': [35, 70, -10, 40],
    'North America': [15, 70, -170, -50],
    'South America': [-55, 15, -80, -35],
    'Oceania': [-50, -5, 110, 180]
  }
  
  const [minLat, maxLat, minLng, maxLng] = bounds[continent] || [-90, 90, -180, 180]
  
  // Add some randomness to coordinates
  const lat = random(minLat, maxLat) + random(-5, 5)
  const lng = random(minLng, maxLng) + random(-5, 5)
  
  return [lng, lat] // GeoJSON uses [lng, lat]
}

// Generate species data
function generateSpecies(count: number): SpeciesEntity[] {
  const species: SpeciesEntity[] = []
  const conservations: Array<'EX' | 'EW' | 'CR' | 'EN' | 'VU' | 'NT' | 'LC'> = ['EX', 'EW', 'CR', 'EN', 'VU', 'VU', 'VU', 'NT', 'NT', 'LC']
  
  for (let i = 0; i < count; i++) {
    const categoryData = randomChoice(speciesCategories)
    const speciesName = randomChoice(categoryData.species)
    const region = randomChoice(Object.keys({ 
      Africa: true, Asia: true, Europe: true, 
      'North America': true, 'South America': true, Oceania: true 
    }))
    
    const [lng, lat] = generateLatLng(region)
    
    species.push({
      id: `species-${i + 1}`,
      name: speciesName,
      scientificName: generateScientificName(speciesName),
      category: categoryData.name,
      conservationStatus: randomChoice(conservations),
      latitude: lat,
      longitude: lng,
      population: randomInt(10, 50000),
      habitat: randomChoice(habitats),
      imageUrl: `https://upload.wikimedia.org/wikipedia/commons/thumb/species/${i % 100}.jpg/320px-species-${i % 100}.jpg`,
      redBookUrl: `https://www.iucnredlist.org/species/${i + 1000}`
    })
  }
  
  return species
}

// Generate project data
function generateProjects(count: number): ProjectEntity[] {
  const projects: ProjectEntity[] = []
  
  for (let i = 0; i < count; i++) {
    const regionData = randomChoice(projectRegions)
    const country = randomChoice(regionData.countries)
    const [lng, lat] = generateLatLng(regionData.region)
    
    projects.push({
      id: `project-${i + 1}`,
      name: `${regionData.region} ${randomChoice(projectCategories)} Initiative`,
      region: regionData.region,
      country,
      latitude: lat,
      longitude: lng,
      beneficiaries: randomInt(100, 50000),
      funding: randomInt(10000, 5000000),
      status: randomChoice(statuses),
      category: randomChoice(projectCategories),
      description: `Conservation project focused on ${randomChoice(projectCategories).toLowerCase()} in ${country}.`
    })
  }
  
  return projects
}

// Main execution
async function main() {
  console.log('🏗️  EG-Maps Sample Data Generator')
  console.log('===================================\n')
  
  const speciesCount = 12000
  const projectsCount = 5000
  
  // Ensure output directory exists
  const dataDir = join(process.cwd(), 'public', 'data', 'species')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
  
  // Generate data
  console.log(`📊 Generating ${speciesCount} species...`)
  const species = generateSpecies(speciesCount)
  const speciesPath = join(dataDir, 'index.json')
  writeFileSync(speciesPath, JSON.stringify(species, null, 2))
  console.log(`✅ Species data saved to: ${speciesPath}`)
  
  console.log(`\n📊 Generating ${projectsCount} projects...`)
  const projects = generateProjects(projectsCount)
  const projectsPath = join(process.cwd(), 'public', 'data', 'projects.json')
  writeFileSync(projectsPath, JSON.stringify(projects, null, 2))
  console.log(`✅ Project data saved to: ${projectsPath}`)
  
  // Summary
  console.log('\n===================================')
  console.log('📈 Summary:')
  console.log(`   Species: ${species.length.toLocaleString()}`)
  console.log(`   Projects: ${projects.length.toLocaleString()}`)
  console.log(`   Total Entities: ${(species.length + projects.length).toLocaleString()}`)
  console.log('===================================\n')
  console.log('🎉 Data generation complete!')
}

main().catch(console.error)
