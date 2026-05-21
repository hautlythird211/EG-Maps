import { ref, computed, watch } from 'vue'

export type Locale = 'en' | 'es' | 'pt' | 'fr'

export interface Translation {
  [key: string]: string | Translation | ((...args: any[]) => string)
}

const translations: Record<Locale, Translation> = {
  en: {
    // Navigation
    nav: {
      home: 'Home',
      info: 'Info & Feedback',
      projectGrants: 'Project Grants',
      endangeredSpecies: 'Endangered Species',
      joinEarthGuardians: 'Join Earth Guardians',
      switchToLight: 'Switch to Light Mode',
      switchToDark: 'Switch to Dark Mode',
      language: 'Language',
    },
    // Home page
    home: {
      title: 'Earth Guardians',
      subtitle: 'Interactive Data Visualization Platform',
      projectGrantsTitle: 'Project Grants',
      projectGrantsDesc: 'Explore global grant initiatives and their impact on communities worldwide',
      speciesTitle: 'Endangered Species',
      speciesDesc: 'Discover critically endangered species and their habitats around the world',
      projectsCount: 'Projects',
      beneficiariesCount: 'Beneficiaries',
      speciesCount: 'Species',
      groupsCount: 'Groups',
      view2d: '2D Map',
      view3d: '3D Globe',
      projectGrants: 'Project Grants',
      species: 'Endangered Species',
      footer: 'Empowering youth-led environmental action worldwide',
    },
    // Map controls
    mapControls: {
      search: 'Search',
      searchProjects: 'Search Projects',
      searchSpecies: 'Search Species',
      searchPlaceholder: 'Search by name or location...',
      searchSpeciesPlaceholder: 'Search by name or region...',
      showAll: 'Show All',
      hideHexGrid: 'Hide Hex Grid',
      showHexGrid: 'Show Hex Grid',
      fullscreen: 'Fullscreen',
      enterFullscreen: 'Enter Fullscreen',
      exitFullscreen: 'Exit Fullscreen',
      recent: 'Recent',
      noResults: 'No results found',
      tryDifferent: 'Try a different search term',
      allItems: 'All Items',
      results: 'Results',
      clickToNavigate: 'Click to navigate',
      showing: 'Showing {count} of {total}',
      of: 'of',
      keyboardShortcut: '(Ctrl+K)',
      browseAll: 'or click "List" to browse all',
    },
    // Filter panel
    filter: {
      filterSpecies: 'Filter Species',
      filterProjects: 'Filter Projects',
      searchPlaceholder: 'Search by name, region...',
      taxonomicGroup: 'Taxonomic Group',
      region: 'Region',
      ecosystem: 'Ecosystem',
      threatType: 'Threat Type',
      allGroups: 'All Groups',
      allRegions: 'All Regions',
      allEcosystems: 'All Ecosystems',
      allThreats: 'All Threats',
      showing: 'Showing {count} of {total} species',
      showingProjects: 'Showing {count} of {total} projects',
      reset: 'Reset',
      status: 'Status',
      allStatuses: 'All Statuses',
      active: 'Active',
      completed: 'Completed',
      country: 'Country',
      allCountries: 'All Countries',
      beneficiaryRange: 'Beneficiary Range',
      allRanges: 'All Ranges',
      under1000: 'Under 1,000',
      range1000to10000: '1,000 - 10,000',
      range10000to50000: '10,000 - 50,000',
      over50000: 'Over 50,000',
      moreGroups: '+{count} more',
    },
    // Stats
    stats: {
      title: '2024 Project Grants Impact',
      projectGrantees: 'Project Grantees',
      countries: 'Countries',
      directBeneficiaries: 'Direct Beneficiaries',
      indirectBeneficiaries: 'Indirect Beneficiaries',
      collapse: 'Collapse',
      expand: 'Expand',
      close: 'Close',
    },
    // Globe
    globe: {
      loading: 'Loading 3D Globe',
      preparingData: 'Preparing {dataset} data...',
      unableToLoad: 'Unable to Load Visualization',
      connectionError: 'The component could not be loaded. Please check your connection and try again.',
      tryAgain: 'Try Again',
      taxonomicGroups: 'Taxonomic Groups',
      switchTo2d: 'Switch to 2D Map view',
      switchTo3d: 'Switch to 3D Globe view',
      view2D: '2D Map',
      view3D: '3D Globe',
    },
    // Project popup
    project: {
      directBeneficiaries: 'Direct Beneficiaries',
      indirectBeneficiaries: 'Indirect Beneficiaries',
      location: 'Location',
      status: 'Status',
      unknownLocation: 'Unknown location',
    },
    // Species popup
    species: {
      scientificName: 'Scientific Name',
      threatTypes: 'Threat Types',
      population: 'Population',
      habitat: 'Habitat',
    },
    // Info page
    info: {
      title: 'Info & Feedback',
      about: 'About',
      aboutText: 'Earth Guardians is a youth-led organization empowering communities worldwide through environmental action and data-driven storytelling.',
      feedback: 'Feedback',
      feedbackText: 'Help us improve by sharing your thoughts and suggestions.',
      contact: 'Contact',
      documentation: 'Documentation',
      dataSources: 'Data Sources',
      methodology: 'Methodology',
      projectGrants: 'Project Grants',
      projectGrantsDesc: "Explore Earth Guardians' global grant initiatives supporting communities worldwide. The visualization shows {count} active projects with comprehensive beneficiary statistics.",
      view2dMap: 'View 2D Map',
      view3dGlobe: 'View 3D Globe',
      endangeredSpecies: 'Endangered Species',
      endangeredSpeciesDesc: 'Discover critically endangered species and their habitats around the world. The database contains {speciesCount} species across {groupCount} taxonomic groups with comprehensive metadata.',
      projects: 'Projects',
      directBeneficiaries: 'Direct Beneficiaries',
      indirectBeneficiaries: 'Indirect Beneficiaries',
      speciesLabel: 'Species',
      taxonomicGroups: 'Taxonomic Groups',
      globalCoverage: 'Global Coverage',
      feedbackName: 'Your Name (optional)',
      feedbackNamePlaceholder: 'Enter your name',
      feedbackType: 'Feedback Type',
      bugReport: 'Bug Report',
      featureRequest: 'Feature Request',
      improvementSuggestion: 'Improvement Suggestion',
      generalFeedback: 'General Feedback',
      yourFeedback: 'Your Feedback',
      feedbackPlaceholder: 'Share your thoughts, report a bug, or suggest a feature...',
      submitFeedback: 'Submit Feedback',
      feedbackSubmitted: 'Thank you! Your feedback has been submitted.',
      makeDifference: 'Want to Make a Difference?',
      makeDifferenceDesc: 'Join Earth Guardians and become part of the movement protecting our planet.',
      joinUs: 'Join Earth Guardians',
    },
    // General
    general: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      close: 'Close',
      save: 'Save',
      cancel: 'Cancel',
    },
    // Error page
    error: {
      pageNotFound: 'Page not found',
      somethingWrong: 'Something went wrong',
      goHome: 'Go Home',
      tryAgain: 'Try Again',
    },
  },
  es: {
    nav: {
      home: 'Inicio',
      info: 'Info y Comentarios',
      projectGrants: 'Subvenciones',
      endangeredSpecies: 'Especies en Peligro',
      joinEarthGuardians: 'Unirse a Earth Guardians',
      switchToLight: 'Modo Claro',
      switchToDark: 'Modo Oscuro',
      language: 'Idioma',
    },
    home: {
      title: 'Earth Guardians',
      subtitle: 'Plataforma Interactiva de Visualización de Datos',
      projectGrantsTitle: 'Subvenciones',
      projectGrantsDesc: 'Explore iniciativas de financiamiento global y su impacto en comunidades worldwide',
      speciesTitle: 'Especies en Peligro',
      speciesDesc: 'Descubre species críticamente en peligro y sus hábitats en todo el mundo',
      projectsCount: 'Proyectos',
      beneficiariesCount: 'Beneficiarios',
      speciesCount: 'Especies',
      groupsCount: 'Grupos',
      view2d: 'Mapa 2D',
      view3d: 'Globo 3D',
      projectGrants: 'Subvenciones',
      species: 'Especies en Peligro',
      footer: 'Empoderando acción ambiental liderada por jóvenes worldwide',
    },
    mapControls: {
      search: 'Buscar',
      searchProjects: 'Buscar Proyectos',
      searchSpecies: 'Buscar Especies',
      searchPlaceholder: 'Buscar por nombre o ubicación...',
      searchSpeciesPlaceholder: 'Buscar por nombre o región...',
      showAll: 'Mostrar Todo',
      hideHexGrid: 'Ocultar Hex',
      showHexGrid: 'Mostrar Hex',
      fullscreen: 'Pantalla Completa',
      enterFullscreen: 'Pantalla Completa',
      exitFullscreen: 'Salir de Pantalla Completa',
      recent: 'Recientes',
      noResults: 'No se encontraron resultados',
      tryDifferent: 'Intenta con otro término',
      allItems: 'Todos',
      results: 'Resultados',
      clickToNavigate: 'Clic para navegar',
      showing: 'Mostrando {count} de {total}',
      of: 'de',
      keyboardShortcut: '(Ctrl+K)',
      browseAll: 'o haz clic en "Lista" para ver todo',
    },
    filter: {
      filterSpecies: 'Filtrar Especies',
      filterProjects: 'Filtrar Proyectos',
      searchPlaceholder: 'Buscar por nombre, región...',
      taxonomicGroup: 'Grupo Taxonómico',
      region: 'Región',
      ecosystem: 'Ecosistema',
      threatType: 'Tipo de Amenaza',
      allGroups: 'Todos los Grupos',
      allRegions: 'Todas las Regiones',
      allEcosystems: 'Todos los Ecosistemas',
      allThreats: 'Todas las Amenazas',
      showing: 'Mostrando {count} de {total} especies',
      showingProjects: 'Mostrando {count} de {total} proyectos',
      reset: 'Restablecer',
      status: 'Estado',
      allStatuses: 'Todos los Estados',
      active: 'Activo',
      completed: 'Completado',
      country: 'País',
      allCountries: 'Todos los Países',
      beneficiaryRange: 'Rango de Beneficiarios',
      allRanges: 'Todos los Rangos',
      under1000: 'Menos de 1,000',
      range1000to10000: '1,000 - 10,000',
      range10000to50000: '10,000 - 50,000',
      over50000: 'Más de 50,000',
      moreGroups: '+{count} más',
    },
    stats: {
      title: 'Impacto 2024 de Subvenciones',
      projectGrantees: 'Proyectos',
      countries: 'Países',
      directBeneficiaries: 'Beneficiarios Directos',
      indirectBeneficiaries: 'Beneficiarios Indirectos',
      collapse: 'Colapsar',
      expand: 'Expandir',
      close: 'Cerrar',
    },
    globe: {
      loading: 'Cargando Globo 3D',
      preparingData: 'Preparando datos de {dataset}...',
      unableToLoad: 'No se puede cargar la visualización',
      connectionError: 'El componente no pudo cargarse. Verifica tu conexión e intenta de nuevo.',
      tryAgain: 'Intentar de Nuevo',
      taxonomicGroups: 'Grupos Taxonómicos',
      switchTo2d: 'Cambiar a Vista de Mapa 2D',
      switchTo3d: 'Cambiar a Vista de Globo 3D',
      view2D: 'Mapa 2D',
      view3D: 'Globo 3D',
    },
    project: {
      directBeneficiaries: 'Beneficiarios Directos',
      indirectBeneficiaries: 'Beneficiarios Indirectos',
      location: 'Ubicación',
      status: 'Estado',
      unknownLocation: 'Ubicación desconocida',
    },
    species: {
      scientificName: 'Nombre Científico',
      threatTypes: 'Tipos de Amenaza',
      population: 'Población',
      habitat: 'Hábitat',
    },
    info: {
      title: 'Info y Comentarios',
      about: 'Acerca de',
      aboutText: 'Earth Guardians es una organización liderada por jóvenes que empodera a comunidades worldwide a través de acción ambiental y narración basada en datos.',
      feedback: 'Comentarios',
      feedbackText: 'Ayúdanos a mejorar compartiendo tus pensamientos y sugerencias.',
      contact: 'Contacto',
      documentation: 'Documentación',
      dataSources: 'Fuentes de Datos',
      methodology: 'Metodología',
      projectGrants: 'Subvenciones',
      projectGrantsDesc: "Explora las iniciativas de subvención global de Earth Guardians respaldando comunidades worldwide. La visualización muestra {count} proyectos activos con estadísticas completas de beneficiarios.",
      view2dMap: 'Ver Mapa 2D',
      view3dGlobe: 'Ver Globo 3D',
      endangeredSpecies: 'Especies en Peligro',
      endangeredSpeciesDesc: 'Descubre especies en peligro crítico y sus hábitats alrededor del mundo. La base de datos contiene {speciesCount} especies en {groupCount} grupos taxonómicos con metadatos completos.',
      projects: 'Proyectos',
      directBeneficiaries: 'Beneficiarios Directos',
      indirectBeneficiaries: 'Beneficiarios Indirectos',
      speciesLabel: 'Especies',
      taxonomicGroups: 'Grupos Taxonómicos',
      globalCoverage: 'Cobertura Global',
      feedbackName: 'Tu Nombre (opcional)',
      feedbackNamePlaceholder: 'Ingresa tu nombre',
      feedbackType: 'Tipo de Comentario',
      bugReport: 'Reporte de Error',
      featureRequest: 'Solicitud de Función',
      improvementSuggestion: 'Sugerencia de Mejora',
      generalFeedback: 'Comentario General',
      yourFeedback: 'Tu Comentario',
      feedbackPlaceholder: 'Comparte tus pensamientos, reporta un error o sugiere una función...',
      submitFeedback: 'Enviar Comentario',
      feedbackSubmitted: '¡Gracias! Tu comentario ha sido enviado.',
      makeDifference: '¿Quieres Hacer la Diferencia?',
      makeDifferenceDesc: 'Únete a Earth Guardians y sé parte del movimiento que protege nuestro planeta.',
      joinUs: 'Unirse a Earth Guardians',
    },
    general: {
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      retry: 'Reintentar',
      close: 'Cerrar',
      save: 'Guardar',
      cancel: 'Cancelar',
    },
  },
  pt: {
    nav: {
      home: 'Início',
      info: 'Info e Feedback',
      projectGrants: 'Subvenções',
      endangeredSpecies: 'Espécies Ameaçadas',
      joinEarthGuardians: 'Junte-se ao Earth Guardians',
      switchToLight: 'Modo Claro',
      switchToDark: 'Modo Escuro',
      language: 'Idioma',
    },
    home: {
      title: 'Earth Guardians',
      subtitle: 'Plataforma Interativa de Visualização de Dados',
      projectGrantsTitle: 'Subvenções',
      projectGrantsDesc: 'Explore iniciativas de subvenção global e seu impacto em comunidades worldwide',
      speciesTitle: 'Espécies Ameaçadas',
      speciesDesc: 'Descubra espécies criticamente ameaçadas e seus habitats ao redor do mundo',
      projectsCount: 'Projetos',
      beneficiariesCount: 'Beneficiários',
      speciesCount: 'Espécies',
      groupsCount: 'Grupos',
      view2d: 'Mapa 2D',
      view3d: 'Globo 3D',
      projectGrants: 'Subvenções',
      species: 'Espécies Ameaçadas',
      footer: 'Capacitando ação ambiental liderada por jovens worldwide',
    },
    mapControls: {
      search: 'Buscar',
      searchProjects: 'Buscar Projetos',
      searchSpecies: 'Buscar Espécies',
      searchPlaceholder: 'Buscar por nome ou localização...',
      searchSpeciesPlaceholder: 'Buscar por nome ou região...',
      showAll: 'Mostrar Tudo',
      hideHexGrid: 'Ocultar Hex',
      showHexGrid: 'Mostrar Hex',
      fullscreen: 'Tela Cheia',
      enterFullscreen: 'Entrar em Tela Cheia',
      exitFullscreen: 'Sair de Tela Cheia',
      recent: 'Recentes',
      noResults: 'Nenhum resultado encontrado',
      tryDifferent: 'Tente um termo diferente',
      allItems: 'Todos',
      results: 'Resultados',
      clickToNavigate: 'Clique para navegar',
      showing: 'Mostrando {count} de {total}',
      of: 'de',
      keyboardShortcut: '(Ctrl+K)',
      browseAll: 'ou clique em "Lista" para ver tudo',
    },
    filter: {
      filterSpecies: 'Filtrar Espécies',
      filterProjects: 'Filtrar Projetos',
      searchPlaceholder: 'Buscar por nome, região...',
      taxonomicGroup: 'Grupo Taxonômico',
      region: 'Região',
      ecosystem: 'Ecossistema',
      threatType: 'Tipo de Ameaça',
      allGroups: 'Todos os Grupos',
      allRegions: 'Todas as Regiões',
      allEcosystems: 'Todos os Ecossistemas',
      allThreats: 'Todas as Ameaças',
      showing: 'Mostrando {count} de {total} espécies',
      showingProjects: 'Mostrando {count} de {total} projetos',
      reset: 'Redefinir',
      status: 'Status',
      allStatuses: 'Todos os Status',
      active: 'Ativo',
      completed: 'Concluído',
      country: 'País',
      allCountries: 'Todos os Países',
      beneficiaryRange: 'Faixa de Beneficiários',
      allRanges: 'Todas as Faixas',
      under1000: 'Menos de 1,000',
      range1000to10000: '1,000 - 10,000',
      range10000to50000: '10,000 - 50,000',
      over50000: 'Mais de 50,000',
      moreGroups: '+{count} mais',
    },
    stats: {
      title: 'Impacto 2024 de Subvenções',
      projectGrantees: 'Projetos',
      countries: 'Países',
      directBeneficiaries: 'Beneficiários Diretos',
      indirectBeneficiaries: 'Beneficiários Indiretos',
      collapse: 'Recolher',
      expand: 'Expandir',
      close: 'Fechar',
    },
    globe: {
      loading: 'Carregando Globo 3D',
      preparingData: 'Preparando dados de {dataset}...',
      unableToLoad: 'Não é possível carregar a visualização',
      connectionError: 'O componente não pôde ser carregado. Verifique sua conexão e tente novamente.',
      tryAgain: 'Tentar Novamente',
      taxonomicGroups: 'Grupos Taxonômicos',
      switchTo2d: 'Mudar para Vista de Mapa 2D',
      switchTo3d: 'Mudar para Vista de Globo 3D',
      view2D: 'Mapa 2D',
      view3D: 'Globo 3D',
    },
    project: {
      directBeneficiaries: 'Beneficiários Diretos',
      indirectBeneficiaries: 'Beneficiários Indiretos',
      location: 'Localização',
      status: 'Status',
      unknownLocation: 'Localização desconhecida',
    },
    species: {
      scientificName: 'Nome Científico',
      threatTypes: 'Tipos de Ameaça',
      population: 'População',
      habitat: 'Habitat',
    },
    info: {
      title: 'Info e Feedback',
      about: 'Sobre',
      aboutText: 'Earth Guardians é uma organização liderada por jovens que capacita comunidades worldwide através de ação ambiental e narrativa baseada em dados.',
      feedback: 'Feedback',
      feedbackText: 'Ajude-nos a melhorar compartilhando seus pensamentos e sugestões.',
      contact: 'Contato',
      documentation: 'Documentação',
      dataSources: 'Fontes de Dados',
      methodology: 'Metodologia',
      projectGrants: 'Subvenções',
      projectGrantsDesc: "Explore as iniciativas de subvenção global da Earth Guardians apoiando comunidades worldwide. A visualização mostra {count} projetos ativos com estatísticas completas de beneficiários.",
      view2dMap: 'Ver Mapa 2D',
      view3dGlobe: 'Ver Globo 3D',
      endangeredSpecies: 'Espécies Ameaçadas',
      endangeredSpeciesDesc: 'Descubra espécies em perigo crítico e seus habitats ao redor do mundo. O banco de dados contém {speciesCount} espécies em {groupCount} grupos taxonômicos com metadados completos.',
      projects: 'Projetos',
      directBeneficiaries: 'Beneficiários Diretos',
      indirectBeneficiaries: 'Beneficiários Indiretos',
      speciesLabel: 'Espécies',
      taxonomicGroups: 'Grupos Taxonômicos',
      globalCoverage: 'Cobertura Global',
      feedbackName: 'Seu Nome (opcional)',
      feedbackNamePlaceholder: 'Digite seu nome',
      feedbackType: 'Tipo de Feedback',
      bugReport: 'Relatório de Bug',
      featureRequest: 'Solicitação de Funcionalidade',
      improvementSuggestion: 'Sugestão de Melhoria',
      generalFeedback: 'Feedback Geral',
      yourFeedback: 'Seu Feedback',
      feedbackPlaceholder: 'Compartilhe seus pensamentos, relate um bug ou sugira uma funcionalidade...',
      submitFeedback: 'Enviar Feedback',
      feedbackSubmitted: 'Obrigado! Seu feedback foi enviado.',
      makeDifference: 'Quer Fazer a Diferença?',
      makeDifferenceDesc: 'Junte-se ao Earth Guardians e faça parte do movimento que protege nosso planeta.',
      joinUs: 'Junte-se ao Earth Guardians',
    },
    general: {
      loading: 'Carregando...',
      error: 'Ocorreu um erro',
      retry: 'Tentar novamente',
      close: 'Fechar',
      save: 'Salvar',
      cancel: 'Cancelar',
    },
    error: {
      pageNotFound: 'Página não encontrada',
      somethingWrong: 'Algo deu errado',
      goHome: 'Voltar ao Início',
      tryAgain: 'Tentar Novamente',
    },
  },
  fr: {
    nav: {
      home: 'Accueil',
      info: 'Info et Feedback',
      projectGrants: 'Subventions',
      endangeredSpecies: 'Espèces Menacées',
      joinEarthGuardians: 'Rejoindre Earth Guardians',
      switchToLight: 'Mode Clair',
      switchToDark: 'Mode Sombre',
      language: 'Langue',
    },
    home: {
      title: 'Earth Guardians',
      subtitle: 'Plateforme Interactive de Visualisation de Données',
      projectGrantsTitle: 'Subventions',
      projectGrantsDesc: 'Explorez les initiatives de subvention mondiales et leur impact sur les communautés',
      speciesTitle: 'Espèces Menacées',
      speciesDesc: 'Découvrez les espèces en danger critique et leurs habitats à travers le monde',
      projectsCount: 'Projets',
      beneficiariesCount: 'Bénéficiaires',
      speciesCount: 'Espèces',
      groupsCount: 'Groupes',
      view2d: 'Carte 2D',
      view3d: 'Globe 3D',
      projectGrants: 'Subventions',
      species: 'Espèces Menacées',
      footer: 'Permettre une action environnementale menée par les jeunes dans le monde',
    },
    mapControls: {
      search: 'Rechercher',
      searchProjects: 'Rechercher Projets',
      searchSpecies: 'Rechercher Espèces',
      searchPlaceholder: 'Rechercher par nom ou lieu...',
      searchSpeciesPlaceholder: 'Rechercher par nom ou région...',
      showAll: 'Tout Afficher',
      hideHexGrid: 'Masquer Hex',
      showHexGrid: 'Afficher Hex',
      fullscreen: 'Plein Écran',
      enterFullscreen: 'Entrer en Plein Écran',
      exitFullscreen: 'Quitter le Plein Écran',
      recent: 'Récents',
      noResults: 'Aucun résultat trouvé',
      tryDifferent: 'Essayez un autre terme',
      allItems: 'Tous',
      results: 'Résultats',
      clickToNavigate: 'Cliquez pour naviguer',
      showing: 'Affichage de {count} sur {total}',
      of: 'sur',
      keyboardShortcut: '(Ctrl+K)',
      browseAll: 'ou cliquez sur "Liste" pour tout parcourir',
    },
    filter: {
      filterSpecies: 'Filtrer Espèces',
      filterProjects: 'Filtrer Projets',
      searchPlaceholder: 'Rechercher par nom, région...',
      taxonomicGroup: 'Groupe Taxonomique',
      region: 'Région',
      ecosystem: 'Écosystème',
      threatType: 'Type de Menace',
      allGroups: 'Tous les Groupes',
      allRegions: 'Toutes les Régions',
      allEcosystems: 'Tous les Écosystèmes',
      allThreats: 'Toutes les Menaces',
      showing: 'Affichage de {count} sur {total} espèces',
      showingProjects: 'Affichage de {count} sur {total} projets',
      reset: 'Réinitialiser',
      status: 'Statut',
      allStatuses: 'Tous les Statuts',
      active: 'Actif',
      completed: 'Terminé',
      country: 'Pays',
      allCountries: 'Tous les Pays',
      beneficiaryRange: 'Tranche de Bénéficiaires',
      allRanges: 'Toutes les Tranches',
      under1000: 'Moins de 1,000',
      range1000to10000: '1,000 - 10,000',
      range10000to50000: '10,000 - 50,000',
      over50000: 'Plus de 50,000',
      moreGroups: '+{count} plus',
    },
    stats: {
      title: 'Impact Subventions 2024',
      projectGrantees: 'Projets',
      countries: 'Pays',
      directBeneficiaries: 'Bénéficiaires Directs',
      indirectBeneficiaries: 'Bénéficiaires Indirects',
      collapse: 'Réduire',
      expand: 'Expandre',
      close: 'Fermer',
    },
    globe: {
      loading: 'Chargement du Globe 3D',
      preparingData: 'Préparation des données {dataset}...',
      unableToLoad: 'Impossible de charger la visualisation',
      connectionError: 'Le composant n\'a pas pu être chargé. Vérifiez votre connexion et réessayez.',
      tryAgain: 'Réessayer',
      taxonomicGroups: 'Groupes Taxonomiques',
      switchTo2d: 'Passer à la Vue Carte 2D',
      switchTo3d: 'Passer à la Vue Globe 3D',
      view2D: 'Carte 2D',
      view3D: 'Globe 3D',
    },
    project: {
      directBeneficiaries: 'Bénéficiaires Directs',
      indirectBeneficiaries: 'Bénéficiaires Indirects',
      location: 'Emplacement',
      status: 'Statut',
      unknownLocation: 'Emplacement inconnu',
    },
    species: {
      scientificName: 'Nom Scientifique',
      threatTypes: 'Types de Menace',
      population: 'Population',
      habitat: 'Habitat',
    },
    info: {
      title: 'Info et Feedback',
      about: 'À Propos',
      aboutText: 'Earth Guardians est une organisation menée par des jeunes qui autonomise les communautés à travers l\'action environnementale et la narration basée sur les données.',
      feedback: 'Feedback',
      feedbackText: 'Aidez-nous à nous améliorer en partageant vos pensées et suggestions.',
      contact: 'Contact',
      documentation: 'Documentation',
      dataSources: 'Sources de Données',
      methodology: 'Méthodologie',
      projectGrants: 'Subventions',
      projectGrantsDesc: "Explorez les initiatives de subvention mondiales d'Earth Guardians soutenant les communautés worldwide. La visualisation montre {count} projets actifs avec des statistiques complètes de bénéficiaires.",
      view2dMap: 'Voir Carte 2D',
      view3dGlobe: 'Voir Globe 3D',
      endangeredSpecies: 'Espèces Menacées',
      endangeredSpeciesDesc: 'Découvrez les espèces en danger critique et leurs habitats à travers le monde. La base de données contient {speciesCount} espèces dans {groupCount} groupes taxonomiques avec des métadonnées complètes.',
      projects: 'Projets',
      directBeneficiaries: 'Bénéficiaires Directs',
      indirectBeneficiaries: 'Bénéficiaires Indirects',
      speciesLabel: 'Espèces',
      taxonomicGroups: 'Groupes Taxonomiques',
      globalCoverage: 'Couverture Mondiale',
      feedbackName: 'Votre Nom (optionnel)',
      feedbackNamePlaceholder: 'Entrez votre nom',
      feedbackType: 'Type de Feedback',
      bugReport: 'Rapport de Bug',
      featureRequest: 'Demande de Fonctionnalité',
      improvementSuggestion: 'Suggestion d\'Amélioration',
      generalFeedback: 'Feedback Général',
      yourFeedback: 'Votre Feedback',
      feedbackPlaceholder: 'Partagez vos pensées, signalez un bug ou suggérez une fonctionnalité...',
      submitFeedback: 'Soumettre le Feedback',
      feedbackSubmitted: 'Merci! Votre feedback a été soumis.',
      makeDifference: 'Voulez-vous Faire la Différence?',
      makeDifferenceDesc: 'Rejoignez Earth Guardians et faites partie du mouvement qui protège notre planète.',
      joinUs: 'Rejoindre Earth Guardians',
    },
    general: {
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      retry: 'Réessayer',
      close: 'Fermer',
      save: 'Enregistrer',
      cancel: 'Annuler',
    },
    error: {
      pageNotFound: 'Page non trouvée',
      somethingWrong: 'Quelque chose a mal tourné',
      goHome: 'Retour à l\'Accueil',
      tryAgain: 'Réessayer',
    },
  },
}

// Get initial locale from browser or storage
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  
  // Check localStorage first
  const stored = localStorage.getItem('eg-maps-locale')
  if (stored && ['en', 'es', 'pt', 'fr'].includes(stored)) {
    return stored as Locale
  }
  
  // Check browser language
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('es')) return 'es'
  if (browserLang.startsWith('pt')) return 'pt'
  if (browserLang.startsWith('fr')) return 'fr'
  
  return 'en'
}

// Create composable
export function useI18n() {
  const locale = ref<Locale>(getInitialLocale())
  
  // Save locale to localStorage when changed
  watch(locale, (newLocale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('eg-maps-locale', newLocale)
    }
  })
  
  // Get nested translation by path (e.g., 'nav.home')
  function t(key: string, ...args: any[]): string {
    const keys = key.split('.')
    let value: any = translations[locale.value]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to English
        value = translations.en
        for (const k2 of keys) {
          if (value && typeof value === 'object' && k2 in value) {
            value = value[k2]
          } else {
            return key // Return key if not found
          }
        }
        break
      }
    }
    
    if (typeof value === 'function') {
      return value(...args)
    }
    
    if (typeof value === 'string') {
      // Replace placeholders like {count}
      let result = value
      args.forEach((arg, i) => {
        result = result.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg))
      })
      // Also handle named placeholders like {count}
      if (args.length === 1 && typeof args[0] === 'object') {
        const obj = args[0] as Record<string, any>
        Object.keys(obj).forEach(k => {
          result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(obj[k]))
        })
      }
      return result
    }
    
    return key
  }
  
  // Available locales
  const availableLocales: Locale[] = ['en', 'es', 'pt', 'fr']
  
  // Locale display names
  const localeNames: Record<Locale, string> = {
    en: 'English',
    es: 'Español',
    pt: 'Português',
    fr: 'Français',
  }
  
  // Set locale function
  function setLocale(newLocale: Locale) {
    locale.value = newLocale
  }
  
  return {
    locale,
    t,
    availableLocales,
    localeNames,
    setLocale,
  }
}