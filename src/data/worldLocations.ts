export interface LocationItem {
  city: string;
  state: string;
  country: string;
  code?: string;
  populationBadge?: string;
}

export interface CountryData {
  name: string;
  code: string;
  flag: string;
  states: {
    name: string;
    cities: string[];
  }[];
}

export const WORLD_COUNTRIES: CountryData[] = [
  {
    name: 'Bangladesh',
    code: 'BD',
    flag: '🇧🇩',
    states: [
      {
        name: 'Dhaka Division',
        cities: [
          'Dhaka',
          'Gazipur',
          'Gazipura',
          'Khas Gazipur',
          'Narayanganj',
          'Savar',
          'Tongi',
          'Tangail',
          'Narsingdi',
          'Faridpur',
          'Gopalganj',
          'Kishoreganj',
          'Madaripur',
          'Manikganj',
          'Munshiganj',
          'Rajbari',
          'Shariatpur',
          'Keraniganj',
          'Dhamrai'
        ],
      },
      {
        name: 'Chittagong Division',
        cities: [
          'Chittagong',
          'Cox\'s Bazar',
          'Comilla',
          'Brahmanbaria',
          'Chandpur',
          'Feni',
          'Lakshmipur',
          'Noakhali',
          'Khagrachhari',
          'Rangamati',
          'Bandarban',
          'Hathazari',
          'Sitakunda'
        ],
      },
      {
        name: 'Rajshahi Division',
        cities: [
          'Rajshahi',
          'Chak Gazipur',
          'Bogra',
          'Pabna',
          'Sirajganj',
          'Naogaon',
          'Natore',
          'Chapai Nawabganj',
          'Joypurhat',
          'Ishwardi'
        ],
      },
      {
        name: 'Khulna Division',
        cities: [
          'Khulna',
          'Jessore',
          'Kushtia',
          'Jhenaidah',
          'Satkhira',
          'Bagerhat',
          'Chuadanga',
          'Meherpur',
          'Narail',
          'Magura',
          'Benapole'
        ],
      },
      {
        name: 'Sylhet Division',
        cities: [
          'Sylhet',
          'Moulvibazar',
          'Habiganj',
          'Sunamganj',
          'Sreemangal',
          'Beanibazar',
          'Golapganj'
        ],
      },
      {
        name: 'Barisal Division',
        cities: [
          'Barisal',
          'Bhola',
          'Patuakhali',
          'Pirojpur',
          'Barguna',
          'Jhalokati',
          'Kuakata'
        ],
      },
      {
        name: 'Rangpur Division',
        cities: [
          'Rangpur',
          'Dinajpur',
          'Gaibandha',
          'Kurigram',
          'Lalmonirhat',
          'Nilphamari',
          'Panchagarh',
          'Thakurgaon',
          'Saidpur'
        ],
      },
      {
        name: 'Mymensingh Division',
        cities: [
          'Mymensingh',
          'Jamalpur',
          'Netrokona',
          'Sherpur',
          'Muktagacha',
          'Bhaluka',
          'Trishal'
        ],
      },
    ],
  },
  {
    name: 'United States',
    code: 'US',
    flag: '🇺🇸',
    states: [
      {
        name: 'New York',
        cities: ['New York City', 'Brooklyn', 'Queens', 'Manhattan', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers'],
      },
      {
        name: 'California',
        cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Oakland', 'Fresno', 'Long Beach', 'Irvine'],
      },
      {
        name: 'Texas',
        cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Plano'],
      },
      {
        name: 'Florida',
        cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'St. Petersburg', 'Tallahassee'],
      },
      {
        name: 'Illinois',
        cities: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield', 'Peoria'],
      },
      {
        name: 'Washington',
        cities: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Everett'],
      },
      {
        name: 'Massachusetts',
        cities: ['Boston', 'Cambridge', 'Worcester', 'Springfield', 'Lowell'],
      },
      {
        name: 'Pennsylvania',
        cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
      },
      {
        name: 'Georgia',
        cities: ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah'],
      },
      {
        name: 'New Jersey',
        cities: ['Jersey City', 'Newark', 'Paterson', 'Elizabeth', 'Trenton', 'Princeton'],
      },
      {
        name: 'Virginia',
        cities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Arlington', 'Alexandria'],
      },
      {
        name: 'Michigan',
        cities: ['Detroit', 'Grand Rapids', 'Warren', 'Ann Arbor', 'Lansing'],
      },
      {
        name: 'Ohio',
        cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
      },
      {
        name: 'North Carolina',
        cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
      },
      {
        name: 'Colorado',
        cities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Boulder'],
      },
      {
        name: 'Arizona',
        cities: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Tempe'],
      },
    ],
  },
  {
    name: 'India',
    code: 'IN',
    flag: '🇮🇳',
    states: [
      {
        name: 'Delhi NCR',
        cities: ['New Delhi', 'Delhi', 'Noida', 'Gurugram', 'Faridabad', 'Ghaziabad'],
      },
      {
        name: 'Maharashtra',
        cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Navi Mumbai', 'Aurangabad'],
      },
      {
        name: 'West Bengal',
        cities: ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol', 'Darjeeling', 'Kharagpur', 'Malda'],
      },
      {
        name: 'Karnataka',
        cities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'],
      },
      {
        name: 'Tamil Nadu',
        cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
      },
      {
        name: 'Telangana',
        cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
      },
      {
        name: 'Gujarat',
        cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
      },
      {
        name: 'Punjab',
        cities: ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Chandigarh'],
      },
      {
        name: 'Uttar Pradesh',
        cities: ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut'],
      },
      {
        name: 'Rajasthan',
        cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
      },
      {
        name: 'Kerala',
        cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'],
      },
    ],
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    flag: '🇬🇧',
    states: [
      {
        name: 'England',
        cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Newcastle', 'Bristol', 'Sheffield', 'Oxford', 'Cambridge', 'Brighton'],
      },
      {
        name: 'Scotland',
        cities: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness'],
      },
      {
        name: 'Wales',
        cities: ['Cardiff', 'Swansea', 'Newport', 'Bangor'],
      },
      {
        name: 'Northern Ireland',
        cities: ['Belfast', 'Derry', 'Lisburn', 'Newry'],
      },
    ],
  },
  {
    name: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    states: [
      {
        name: 'Ontario',
        cities: ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan'],
      },
      {
        name: 'British Columbia',
        cities: ['Vancouver', 'Victoria', 'Surrey', 'Burnaby', 'Richmond', 'Kelowna'],
      },
      {
        name: 'Quebec',
        cities: ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil'],
      },
      {
        name: 'Alberta',
        cities: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge'],
      },
      {
        name: 'Manitoba',
        cities: ['Winnipeg', 'Brandon', 'Steinbach'],
      },
    ],
  },
  {
    name: 'Australia',
    code: 'AU',
    flag: '🇦🇺',
    states: [
      {
        name: 'New South Wales',
        cities: ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast'],
      },
      {
        name: 'Victoria',
        cities: ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo'],
      },
      {
        name: 'Queensland',
        cities: ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Cairns', 'Townsville'],
      },
      {
        name: 'Western Australia',
        cities: ['Perth', 'Fremantle', 'Mandurah', 'Bunbury'],
      },
      {
        name: 'South Australia',
        cities: ['Adelaide', 'Mount Gambier', 'Whyalla'],
      },
    ],
  },
  {
    name: 'United Arab Emirates',
    code: 'AE',
    flag: '🇦🇪',
    states: [
      {
        name: 'Dubai',
        cities: ['Dubai', 'Deira', 'Bur Dubai', 'Dubai Marina', 'Downtown Dubai', 'Jumeirah'],
      },
      {
        name: 'Abu Dhabi',
        cities: ['Abu Dhabi', 'Al Ain', 'Madinat Zayed', 'Al Ruwais'],
      },
      {
        name: 'Sharjah',
        cities: ['Sharjah', 'Khor Fakkan', 'Kalba'],
      },
      {
        name: 'Ajman',
        cities: ['Ajman'],
      },
      {
        name: 'Ras Al Khaimah',
        cities: ['Ras Al Khaimah'],
      },
    ],
  },
  {
    name: 'Saudi Arabia',
    code: 'SA',
    flag: '🇸🇦',
    states: [
      {
        name: 'Riyadh Province',
        cities: ['Riyadh', 'Al Kharj', 'Ad Diriyah'],
      },
      {
        name: 'Makkah Province',
        cities: ['Jeddah', 'Mecca', 'Taif'],
      },
      {
        name: 'Madinah Province',
        cities: ['Medina', 'Yanbu'],
      },
      {
        name: 'Eastern Province',
        cities: ['Dammam', 'Khobar', 'Dhahran', 'Jubail', 'Al Ahsa'],
      },
    ],
  },
  {
    name: 'Germany',
    code: 'DE',
    flag: '🇩🇪',
    states: [
      {
        name: 'Berlin',
        cities: ['Berlin'],
      },
      {
        name: 'Bavaria',
        cities: ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg'],
      },
      {
        name: 'North Rhine-Westphalia',
        cities: ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Bonn'],
      },
      {
        name: 'Hesse',
        cities: ['Frankfurt', 'Wiesbaden', 'Kassel', 'Darmstadt'],
      },
      {
        name: 'Hamburg',
        cities: ['Hamburg'],
      },
      {
        name: 'Baden-Württemberg',
        cities: ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Heidelberg', 'Freiburg'],
      },
    ],
  },
  {
    name: 'France',
    code: 'FR',
    flag: '🇫🇷',
    states: [
      {
        name: 'Île-de-France',
        cities: ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Versailles'],
      },
      {
        name: 'Provence-Alpes-Côte d\'Azur',
        cities: ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Cannes'],
      },
      {
        name: 'Auvergne-Rhône-Alpes',
        cities: ['Lyon', 'Grenoble', 'Saint-Étienne', 'Clermont-Ferrand'],
      },
      {
        name: 'Occitanie',
        cities: ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan'],
      },
      {
        name: 'Nouvelle-Aquitaine',
        cities: ['Bordeaux', 'Limoges', 'Poitiers', 'Pau'],
      },
    ],
  },
  {
    name: 'Japan',
    code: 'JP',
    flag: '🇯🇵',
    states: [
      {
        name: 'Kanto',
        cities: ['Tokyo', 'Yokohama', 'Kawasaki', 'Saitama', 'Chiba'],
      },
      {
        name: 'Kansai',
        cities: ['Osaka', 'Kyoto', 'Kobe', 'Nara', 'Sakai'],
      },
      {
        name: 'Chubu',
        cities: ['Nagoya', 'Shizuoka', 'Niigata', 'Hamamatsu'],
      },
      {
        name: 'Hokkaido',
        cities: ['Sapporo', 'Asahikawa', 'Hakodate'],
      },
      {
        name: 'Kyushu',
        cities: ['Fukuoka', 'Kitakyushu', 'Kumamoto', 'Kagoshima'],
      },
    ],
  },
  {
    name: 'South Korea',
    code: 'KR',
    flag: '🇰🇷',
    states: [
      {
        name: 'Seoul Capital Area',
        cities: ['Seoul', 'Incheon', 'Suwon', 'Seongnam', 'Goyang', 'Yongin'],
      },
      {
        name: 'Gyeongsang',
        cities: ['Busan', 'Daegu', 'Ulsan', 'Changwon', 'Pohang'],
      },
      {
        name: 'Jeolla & Chungcheong',
        cities: ['Daejeon', 'Gwangju', 'Cheongju', 'Jeonju', 'Cheonan'],
      },
      {
        name: 'Jeju',
        cities: ['Jeju City', 'Seogwipo'],
      },
    ],
  },
  {
    name: 'Spain',
    code: 'ES',
    flag: '🇪🇸',
    states: [
      {
        name: 'Community of Madrid',
        cities: ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada'],
      },
      {
        name: 'Catalonia',
        cities: ['Barcelona', 'L\'Hospitalet de Llobregat', 'Badalona', 'Terrassa', 'Girona'],
      },
      {
        name: 'Andalusia',
        cities: ['Seville', 'Málaga', 'Córdoba', 'Granada', 'Marbella'],
      },
      {
        name: 'Valencian Community',
        cities: ['Valencia', 'Alicante', 'Elche', 'Castellón'],
      },
    ],
  },
  {
    name: 'Italy',
    code: 'IT',
    flag: '🇮🇹',
    states: [
      {
        name: 'Lombardy',
        cities: ['Milan', 'Brescia', 'Monza', 'Bergamo', 'Como'],
      },
      {
        name: 'Lazio',
        cities: ['Rome', 'Latina', 'Guidonia Montecelio', 'Fiumicino'],
      },
      {
        name: 'Campania',
        cities: ['Naples', 'Salerno', 'Giugliano in Campania', 'Caserta'],
      },
      {
        name: 'Piedmont',
        cities: ['Turin', 'Novara', 'Alessandria', 'Asti'],
      },
      {
        name: 'Veneto',
        cities: ['Venice', 'Verona', 'Padua', 'Vicenza', 'Treviso'],
      },
      {
        name: 'Tuscany',
        cities: ['Florence', 'Prato', 'Livorno', 'Pisa', 'Siena'],
      },
    ],
  },
  {
    name: 'Malaysia',
    code: 'MY',
    flag: '🇲🇾',
    states: [
      {
        name: 'Kuala Lumpur / Selangor',
        cities: ['Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya', 'Klang', 'Cyberjaya', 'Putrajaya'],
      },
      {
        name: 'Penang',
        cities: ['George Town', 'Butterworth', 'Bayan Lepas'],
      },
      {
        name: 'Johor',
        cities: ['Johor Bahru', 'Batu Pahat', 'Muar', 'Kluang'],
      },
      {
        name: 'Sabah & Sarawak',
        cities: ['Kota Kinabalu', 'Kuching', 'Miri', 'Sandakan'],
      },
    ],
  },
  {
    name: 'Singapore',
    code: 'SG',
    flag: '🇸🇬',
    states: [
      {
        name: 'Singapore Region',
        cities: ['Singapore', 'Central Area', 'Jurong East', 'Tampines', 'Woodlands', 'Orchard', 'Marina Bay'],
      },
    ],
  },
  {
    name: 'Pakistan',
    code: 'PK',
    flag: '🇵🇰',
    states: [
      {
        name: 'Punjab',
        cities: ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot'],
      },
      {
        name: 'Sindh',
        cities: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana'],
      },
      {
        name: 'Islamabad Capital Territory',
        cities: ['Islamabad'],
      },
      {
        name: 'Khyber Pakhtunkhwa',
        cities: ['Peshawar', 'Abbottabad', 'Mardan', 'Swat'],
      },
    ],
  },
  {
    name: 'Qatar',
    code: 'QA',
    flag: '🇶🇦',
    states: [
      {
        name: 'Doha & Municipalities',
        cities: ['Doha', 'Al Rayyan', 'Al Wakrah', 'Lusail', 'Al Khor'],
      },
    ],
  },
  {
    name: 'Kuwait',
    code: 'KW',
    flag: '🇰🇼',
    states: [
      {
        name: 'Kuwait Governorates',
        cities: ['Kuwait City', 'Hawally', 'Salmiya', 'Al Ahmadi', 'Farwaniya'],
      },
    ],
  },
  {
    name: 'Oman',
    code: 'OM',
    flag: '🇴🇲',
    states: [
      {
        name: 'Muscat & Regions',
        cities: ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur'],
      },
    ],
  },
  {
    name: 'Bahrain',
    code: 'BH',
    flag: '🇧🇭',
    states: [
      {
        name: 'Bahrain Governorates',
        cities: ['Manama', 'Riffa', 'Muharraq', 'Hamad Town'],
      },
    ],
  },
  {
    name: 'Turkey',
    code: 'TR',
    flag: '🇹🇷',
    states: [
      {
        name: 'Marmara',
        cities: ['Istanbul', 'Bursa', 'Kocaeli', 'Sakarya'],
      },
      {
        name: 'Central Anatolia',
        cities: ['Ankara', 'Konya', 'Kayseri', 'Eskişehir'],
      },
      {
        name: 'Aegean & Mediterranean',
        cities: ['Izmir', 'Antalya', 'Adana', 'Mersin', 'Bodrum'],
      },
    ],
  },
  {
    name: 'Brazil',
    code: 'BR',
    flag: '🇧🇷',
    states: [
      {
        name: 'São Paulo',
        cities: ['São Paulo', 'Campinas', 'Guarulhos', 'São Bernardo do Campo', 'Santos'],
      },
      {
        name: 'Rio de Janeiro',
        cities: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Niterói'],
      },
      {
        name: 'Federal District',
        cities: ['Brasília'],
      },
      {
        name: 'Bahia & Minas Gerais',
        cities: ['Belo Horizonte', 'Salvador', 'Fortaleza', 'Recife', 'Curitiba'],
      },
    ],
  },
  {
    name: 'China',
    code: 'CN',
    flag: '🇨🇳',
    states: [
      {
        name: 'Direct Municipalities',
        cities: ['Beijing', 'Shanghai', 'Chongqing', 'Tianjin'],
      },
      {
        name: 'Guangdong',
        cities: ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan'],
      },
      {
        name: 'Zhejiang & Jiangsu',
        cities: ['Hangzhou', 'Ningbo', 'Nanjing', 'Suzhou', 'Wuxi'],
      },
      {
        name: 'Hong Kong & Macau',
        cities: ['Hong Kong', 'Macau'],
      },
    ],
  },
  {
    name: 'Indonesia',
    code: 'ID',
    flag: '🇮🇩',
    states: [
      {
        name: 'Java',
        cities: ['Jakarta', 'Surabaya', 'Bandung', 'Bekasi', 'Tangerang', 'Semarang', 'Yogyakarta'],
      },
      {
        name: 'Bali & Sumatra',
        cities: ['Denpasar', 'Medan', 'Palembang', 'Makassar'],
      },
    ],
  },
  {
    name: 'Thailand',
    code: 'TH',
    flag: '🇹🇭',
    states: [
      {
        name: 'Central & Bangkok',
        cities: ['Bangkok', 'Nonthaburi', 'Pattaya', 'Samut Prakan'],
      },
      {
        name: 'Northern & Southern',
        cities: ['Chiang Mai', 'Phuket', 'Hat Yai', 'Khon Kaen'],
      },
    ],
  },
  {
    name: 'Egypt',
    code: 'EG',
    flag: '🇪🇬',
    states: [
      {
        name: 'Cairo & Giza',
        cities: ['Cairo', 'Giza', 'Shubra El Kheima', '6th of October City'],
      },
      {
        name: 'Alexandria & Coastal',
        cities: ['Alexandria', 'Port Said', 'Suez', 'Sharm El Sheikh', 'Hurghada'],
      },
    ],
  },
  {
    name: 'South Africa',
    code: 'ZA',
    flag: '🇿🇦',
    states: [
      {
        name: 'Gauteng',
        cities: ['Johannesburg', 'Pretoria', 'Soweto'],
      },
      {
        name: 'Western Cape',
        cities: ['Cape Town', 'Stellenbosch', 'George'],
      },
      {
        name: 'KwaZulu-Natal',
        cities: ['Durban', 'Pietermaritzburg'],
      },
    ],
  },
  {
    name: 'Sweden',
    code: 'SE',
    flag: '🇸🇪',
    states: [
      {
        name: 'Svealand & Götaland',
        cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'],
      },
    ],
  },
  {
    name: 'Switzerland',
    code: 'CH',
    flag: '🇨🇭',
    states: [
      {
        name: 'Swiss Cantons',
        cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Lucerne'],
      },
    ],
  },
  {
    name: 'Netherlands',
    code: 'NL',
    flag: '🇳🇱',
    states: [
      {
        name: 'North & South Holland',
        cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen'],
      },
    ],
  },
  {
    name: 'Russia',
    code: 'RU',
    flag: '🇷🇺',
    states: [
      {
        name: 'Central & Northwestern',
        cities: ['Moscow', 'Saint Petersburg', 'Kazan', 'Nizhny Novgorod', 'Novosibirsk', 'Yekaterinburg'],
      },
    ],
  },
  {
    name: 'Mexico',
    code: 'MX',
    flag: '🇲🇽',
    states: [
      {
        name: 'Central Mexico',
        cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Cancún'],
      },
    ],
  },
  {
    name: 'Argentina',
    code: 'AR',
    flag: '🇦🇷',
    states: [
      {
        name: 'Buenos Aires & Regions',
        cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'],
      },
    ],
  },
  {
    name: 'Vietnam',
    code: 'VN',
    flag: '🇻🇳',
    states: [
      {
        name: 'North & South Vietnam',
        cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho'],
      },
    ],
  },
  {
    name: 'Philippines',
    code: 'PH',
    flag: '🇵🇭',
    states: [
      {
        name: 'Metro Manila & Regions',
        cities: ['Manila', 'Quezon City', 'Makati', 'Davao City', 'Cebu City', 'Taguig'],
      },
    ],
  },
  {
    name: 'Nepal',
    code: 'NP',
    flag: '🇳🇵',
    states: [
      {
        name: 'Bagmati & Provinces',
        cities: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Bharatpur'],
      },
    ],
  },
  {
    name: 'Sri Lanka',
    code: 'LK',
    flag: '🇱🇰',
    states: [
      {
        name: 'Western & Central',
        cities: ['Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna'],
      },
    ],
  },
];

// Flat indexed array of pre-built search items for ultra-fast Facebook-style autocomplete
export const ALL_INDEXED_LOCATIONS: LocationItem[] = [];

// Populate indexed locations
WORLD_COUNTRIES.forEach((c) => {
  c.states.forEach((s) => {
    s.cities.forEach((cityName, cityIdx) => {
      ALL_INDEXED_LOCATIONS.push({
        city: cityName,
        state: s.name,
        country: c.name,
        code: c.code,
        populationBadge: cityIdx < 3 ? 'Added by 10.0K+ members' : cityIdx < 6 ? 'Added by 5.2K+ members' : 'Added by 850+ members',
      });
    });
  });
});

/**
 * Facebook-style fuzzy location search algorithm
 * Matches city name, state/division, or country
 */
export function searchLocations(query: string, maxResults = 8): LocationItem[] {
  if (!query || query.trim().length === 0) {
    return ALL_INDEXED_LOCATIONS.slice(0, maxResults);
  }

  const cleanQuery = query.toLowerCase().trim();
  const startsWithMatches: LocationItem[] = [];
  const containsMatches: LocationItem[] = [];

  for (const item of ALL_INDEXED_LOCATIONS) {
    const cityLower = item.city.toLowerCase();
    const stateLower = item.state.toLowerCase();
    const countryLower = item.country.toLowerCase();
    const combined = `${cityLower}, ${stateLower}, ${countryLower}`;

    if (cityLower.startsWith(cleanQuery)) {
      startsWithMatches.push(item);
    } else if (combined.includes(cleanQuery)) {
      containsMatches.push(item);
    }

    if (startsWithMatches.length + containsMatches.length >= maxResults * 2) {
      break;
    }
  }

  return [...startsWithMatches, ...containsMatches].slice(0, maxResults);
}

/**
 * Get all country names
 */
export function getAllCountries(): { name: string; code: string; flag: string }[] {
  return WORLD_COUNTRIES.map((c) => ({
    name: c.name,
    code: c.code,
    flag: c.flag,
  }));
}

/**
 * Get states for a specific country
 */
export function getStatesForCountry(countryName: string): string[] {
  const country = WORLD_COUNTRIES.find((c) => c.name.toLowerCase() === countryName.toLowerCase());
  if (!country) return [];
  return country.states.map((s) => s.name);
}

/**
 * Get cities for a specific country and state
 */
export function getCitiesForState(countryName: string, stateName: string): string[] {
  const country = WORLD_COUNTRIES.find((c) => c.name.toLowerCase() === countryName.toLowerCase());
  if (!country) return [];
  const state = country.states.find((s) => s.name.toLowerCase() === stateName.toLowerCase());
  if (!state) return [];
  return state.cities;
}
