import os, django
from datetime import time

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cravio.settings')
django.setup()

from django.contrib.auth import get_user_model
from restaurants.models import Restaurant
from foods.models import Category, Food
from django.core.management import call_command

User = get_user_model()

print("Clearing database...")
call_command('flush', interactive=False)

print("Seeding real restaurants and menus across India and Gujarat...")

# 1. Create Admin User
admin_user = User.objects.create_superuser(
    username='admin@cravio.app',
    email='admin@cravio.app',
    password='admin123',
    first_name='Admin',
    last_name='Cravio',
    role='admin',
    phone='9000000000'
)
print("  ✓ Admin superuser created")

# 2. Setup Categories
categories_data = [
    ('South Indian', '🥞'),
    ('North Indian', '🍲'),
    ('Italian', '🍝'),
    ('Pizza', '🍕'),
    ('Cafe', '☕'),
    ('Biryani', '🍛'),
    ('Seafood', '🐟'),
    ('Desserts', '🍰'),
    ('Street Food', '🍟'),
    ('Gujarati', '🥣'),
]

cats = {}
for name, icon in categories_data:
    c, _ = Category.objects.get_or_create(name=name, defaults={'icon': icon})
    cats[name] = c

# 3. Real Restaurants Data
RESTAURANTS = [
    # Karnataka (Bengaluru)
    {
        'name': 'MTR (Mavalli Tiffin Rooms)',
        'cuisine': 'South Indian',
        'address': '14, Lalbagh Road, Mavalli, Bengaluru',
        'city': 'Bengaluru',
        'state': 'Karnataka',
        'pincode': '560004',
        'phone': '08022220022',
        'email': 'contact@mavallitiffinrooms.com',
        'image': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Mavalli+Tiffin+Room,+Lalbagh+Road,+Bengaluru',
        'description': 'Established in 1924, MTR is a legendary culinary landmark of Bengaluru, famous for inventing the Rava Idli and serving authentic, heritage-quality Karnataka breakfast delicacies.',
        'average_rating': 4.7,
        'total_reviews': 95,
        'menu': [
            ('Rava Idli', 'South Indian', 90, True, 'Steamed semolina cake seasoned with cashew nuts, coriander, and ghee, served with potato sagu and coconut chutney.'),
            ('Ghee Masala Dosa', 'South Indian', 120, True, 'Thick, golden crispy rice crepe smeared with hot red chutney, stuffed with spiced potato mash and served with a dollop of pure ghee.'),
            ('Kharabath', 'South Indian', 75, True, 'Savory semolina pudding roasted in pure ghee and cooked with vegetables, curry leaves, and secret spices.'),
            ('Chandrahara', 'South Indian', 85, True, 'Historic dessert of deep-fried pastry spirals served in a rich cardamom-infused sweet milk cream (rabri).'),
            ('MTR Special Filter Coffee', 'Cafe', 60, True, 'Traditional South Indian chicory-infused coffee brewed in brass filters and frothed with fresh hot milk.'),
        ]
    },
    {
        'name': 'Toit Beer Co.',
        'cuisine': 'Italian, Pizza, Cafe',
        'address': '298, 100 Feet Road, Indiranagar, Bengaluru',
        'city': 'Bengaluru',
        'state': 'Karnataka',
        'pincode': '560038',
        'phone': '09019713388',
        'email': 'info@toit.in',
        'image': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Toit,+Indiranagar,+Bengaluru',
        'description': 'A vibrant and iconic microbrewery in Bengaluru, renowned for its lively pub culture, freshly brewed craft beers, and outstanding wood-fired pizzas.',
        'average_rating': 4.5,
        'total_reviews': 120,
        'menu': [
            ('Wood-Fired Margherita Pizza', 'Pizza', 425, True, 'Classic hand-tossed thin crust pizza topped with fresh tomato sauce, mozzarella cheese, and fresh basil leaves.'),
            ('Toit Baked Jacket Potatoes', 'Cafe', 275, True, 'Baked jacket potatoes loaded with melted cheddar cheese, sour cream, and chives.'),
            ('Spicy BBQ Chicken Wings', 'North Indian', 345, False, 'Crispy chicken wings tossed in a smoky and fiery home-made BBQ sauce, served with celery and blue cheese dip.'),
            ('Toit Special Beef Burger', 'Italian', 495, False, 'Juicy char-grilled beef patty layered with melted cheese, crispy bacon, caramelized onions, and house burger sauce in a brioche bun.'),
            ('Classic Tiramisu', 'Italian', 250, True, 'Layers of espresso-soaked ladyfingers and velvety mascarpone cream, dusted with dark cocoa powder.'),
        ]
    },
    {
        'name': 'Karavalli',
        'cuisine': 'Seafood, South Indian',
        'address': 'Taj Gateway Hotel, 66, Residency Road, Bengaluru',
        'city': 'Bengaluru',
        'state': 'Karnataka',
        'pincode': '560025',
        'phone': '08066604545',
        'email': 'karavalli.gateway@tajhotels.com',
        'image': 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Karavalli,+Residency+Road,+Bengaluru',
        'description': 'An award-winning fine dining restaurant showcasing a rich tapestry of authentic coastal recipes from Goa, Karwar, Mangalore, and Kerala, prepared by master chefs.',
        'average_rating': 4.8,
        'total_reviews': 78,
        'menu': [
            ('Tiger Prawns Roast', 'Seafood', 950, False, 'Succulent tiger prawns tossed in a fiery Mangalorean spice blend with shredded coconut, black pepper, and curry leaves.'),
            ('Karimeen Pollichathu', 'Seafood', 850, False, 'Pearl spot fish marinated in spicy coastal masalas, wrapped in a banana leaf, and pan-roasted to smoky perfection.'),
            ('Kori Gassi', 'South Indian', 620, False, 'Tender chicken pieces simmered in a traditional Mangalorean coconut-milk gravy infused with local spices.'),
            ('Appam with Vegetable Stew', 'South Indian', 320, True, 'Lacy, soft rice and coconut milk pancakes served with a delicate, aromatic stew of mixed vegetables in light coconut milk.'),
            ('Elaneer Payasam', 'South Indian', 280, True, 'Chilled coastal dessert made of fresh tender coconut pulp simmered in sweetened coconut milk and cardamom.'),
        ]
    },
    {
        'name': 'Nagarjuna Residency Road',
        'cuisine': 'Biryani, South Indian',
        'address': '44/4, Residency Road, Bengaluru',
        'city': 'Bengaluru',
        'state': 'Karnataka',
        'pincode': '560025',
        'phone': '08025550005',
        'email': 'info@nagarjunagroup.com',
        'image': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Nagarjuna+Restaurant,+Residency+Road,+Bengaluru',
        'description': 'Highly popular destination famous for serving fiery, authentic Andhra-style vegetarian meals on banana leaves alongside signature spiced chicken biryani.',
        'average_rating': 4.6,
        'total_reviews': 110,
        'menu': [
            ('Signature Andhra Chicken Biryani', 'Biryani', 340, False, 'Long-grain basmati rice slow-dum cooked with spicy marinated chicken pieces, green chilies, and Andhra spices.'),
            ('Andhra Banana Leaf Veg Meals', 'South Indian', 280, True, 'Unlimited traditional Andhra platter featuring rice, signature gun powder (podi), pure ghee, dal (pappu), sambar, rasam, and daily curries.'),
            ('Chicken Nagarjuna Dry', 'South Indian', 310, False, 'Crispy fried chicken bites tossed with a fiery mixture of green chilies, garlic, and fresh curry leaves.'),
            ('Nellore Chepala Pulusu (Fish Curry)', 'Seafood', 420, False, 'Tangy and extremely spicy Andhra-style fish curry prepared with raw tamarind paste and local red spices.'),
            ('Double Ka Meetha', 'Biryani', 120, True, 'Decadent bread pudding soaked in saffron-scented sugar syrup, cardamom milk, and garnished with roasted cashew nuts.'),
        ]
    },

    # Maharashtra (Mumbai)
    {
        'name': 'Britannia & Co. Restaurant',
        'cuisine': 'Cafe, North Indian',
        'address': 'Wakefield House, 11 Sprott Road, Ballard Estate, Fort, Mumbai',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pincode': '400001',
        'phone': '02222615264',
        'email': 'info@britanniaandco.com',
        'image': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Britannia+%26+Co.+Restaurant,+Ballard+Estate,+Mumbai',
        'description': 'Famous legendary Parsi cafe in South Mumbai, serving the iconic Berry Pulav and heritage Parsi delicacies inside a nostalgic colonial-era dining hall since 1923.',
        'average_rating': 4.6,
        'total_reviews': 85,
        'menu': [
            ('Parsi Chicken Berry Pulav', 'Biryani', 450, False, 'Classic fragrant basmati rice layered with spiced chicken, caramelized onions, cashews, and tart barberries imported directly from Iran.'),
            ('Mutton Sali Boti', 'North Indian', 420, False, 'Tender chunks of boneless mutton slow-cooked in a sweet, sour, and spicy gravy, topped with crispy potato matchsticks.'),
            ('Patra ni Machhi', 'Seafood', 550, False, 'Fresh pomfret fish coated in a tangy green coconut chutney, wrapped in banana leaf and steamed to perfection.'),
            ('Parsi Caramel Custard', 'Desserts', 150, True, 'Rich, velvety baked egg custard with a deep, golden caramelized sugar coating.'),
            ('Pallonji Raspberry Soda', 'Cafe', 70, True, 'Nostalgic Mumbai carbonated sweet raspberry drink, a staple accompaniment to Parsi meals.'),
        ]
    },
    {
        'name': 'Leopold Cafe',
        'cuisine': 'Cafe, Italian',
        'address': 'Colaba Causeway, Near Colaba Police Station, Colaba, Mumbai',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pincode': '400001',
        'phone': '02222828185',
        'email': 'contact@leopoldcafe.com',
        'image': 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Leopold+Cafe,+Colaba,+Mumbai',
        'description': 'A historic, landmark multi-cuisine restaurant and bar on Colaba Causeway, serving travelers and locals since 1871. Known for its bustling, high-energy pub atmosphere.',
        'average_rating': 4.3,
        'total_reviews': 140,
        'menu': [
            ('Beef Chilli Dry', 'North Indian', 390, False, 'Stir-fried tender beef strips tossed with green chilies, onions, garlic, and dark soy sauce.'),
            ('Leopold Special Pizza', 'Pizza', 450, True, 'Thin crust pizza loaded with bell peppers, mushrooms, olives, sweet corn, and extra mozzarella cheese.'),
            ('Veg Hakka Noodles', 'Cafe', 280, True, 'Classic wok-tossed Hakka noodles with crunchy julienned vegetables and soy sauce.'),
            ('Chicken Stroganoff', 'Italian', 420, False, 'Sautéed chicken pieces and mushrooms in a rich, sour cream and brown gravy, served over buttered rice.'),
            ('Apple Pie with Ice Cream', 'Desserts', 180, True, 'Warm baked apple pie infused with cinnamon, served with a scoop of vanilla bean ice cream.'),
        ]
    },

    # Delhi
    {
        'name': "Karim's",
        'cuisine': 'North Indian',
        'address': '16, Gali Kababian, Jama Masjid, Old Delhi, Delhi',
        'city': 'Delhi',
        'state': 'Delhi',
        'pincode': '110006',
        'phone': '01123264981',
        'email': 'karims.jamamasjid@gmail.com',
        'image': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Karims,+Jama+Masjid,+Delhi',
        'description': 'Established in 1913 near the historic Jama Masjid, Karim\'s is legendary for preserving and serving authentic royal Mughlai recipes direct from the Mughal emperor\'s kitchens.',
        'average_rating': 4.7,
        'total_reviews': 210,
        'menu': [
            ('Mutton Korma', 'North Indian', 380, False, 'Tender mutton slow-cooked in a rich, aromatic gravy of yogurt, browned onions, saffron, and traditional spices.'),
            ('Chicken Jahangiri', 'North Indian', 360, False, 'Succulent chicken pieces cooked in a thick, mildly spicy, and tangy tomato-onion gravy, a royal favorite.'),
            ('Mutton Seekh Kebab', 'North Indian', 240, False, 'Minced mutton skewers seasoned with fresh mint, coriander, and royal spices, char-grilled over hot coals.'),
            ('Khamiri Roti', 'North Indian', 40, True, 'Thick, fluffy, oven-baked leavened yeast flatbread brushed with butter.'),
            ('Shahi Tukda', 'Desserts', 130, True, 'Deep-fried bread slices soaked in saffron sugar syrup and topped with thick, condensed rabri and silver leaf.'),
        ]
    },
    {
        'name': 'Indian Accent',
        'cuisine': 'North Indian, Cafe',
        'address': 'The Lodhi, Lodhi Road, CGO Complex, Pragati Vihar, New Delhi',
        'city': 'Delhi',
        'state': 'Delhi',
        'pincode': '110003',
        'phone': '09871117968',
        'email': 'accent@indianaccent.com',
        'image': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Indian+Accent,+The+Lodhi,+New+Delhi',
        'description': 'Ranked among the best restaurants in Asia, Indian Accent showcases modern Indian cuisine by reinterpreting traditional dishes with global techniques and stunning presentation.',
        'average_rating': 4.9,
        'total_reviews': 95,
        'menu': [
            ('Wild Mushroom Kulcha', 'North Indian', 250, True, 'Mini stuffed flatbread filled with seasoned wild mushrooms and brushed with truffle butter.'),
            ('Meetha Achar Pork Ribs', 'Seafood', 850, False, 'Slow-cooked pork ribs glazed with sweet and tangy mango pickle reduction, topped with toasted sesame.'),
            ('Warm Doda Burfi Treacle Tart', 'Desserts', 420, True, 'A creative fusion of traditional Punjabi milk fudge Doda Burfi baked into an English treacle tart crust.'),
            ('Baked Paneer Pinwheel', 'North Indian', 620, True, 'Spiced cottage cheese roll served over a rich, smooth smoked tomato salan gravy.'),
            ('Pomegranate & Mint Shrub', 'Cafe', 220, True, 'Refreshing house-fermented vinegar syrup drink with fresh pomegranate juice and crushed mint leaves.'),
        ]
    },

    # West Bengal (Kolkata)
    {
        'name': 'Peter Cat',
        'cuisine': 'North Indian, Italian',
        'address': '18A, Park Street, Park Street Area, Kolkata',
        'city': 'Kolkata',
        'state': 'West Bengal',
        'pincode': '700016',
        'phone': '03322298841',
        'email': 'info@petercat.co.in',
        'image': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Peter+Cat,+Park+Street,+Kolkata',
        'description': 'The culinary pride of Kolkata\'s Park Street, Peter Cat is internationally legendary for inventing and serving the Chelo Kebab platter in a charming, vintage retro environment.',
        'average_rating': 4.7,
        'total_reviews': 180,
        'menu': [
            ('Legendary Chelo Kebab', 'Biryani', 420, False, 'A plate of long-grain basmati rice tossed with butter, served with a grilled tomato, poached egg, chicken kebab, and mutton seekh kebab.'),
            ('Mutton Rogan Josh', 'North Indian', 380, False, 'Traditional Kashmiri-style mutton curry cooked in a thin red gravy flavored with dry ginger and Kashmiri chilies.'),
            ('Fish Makhmali Kebab', 'Seafood', 450, False, 'Mouth-melting fresh fish chunks marinated in cream, cheese, and white pepper, grilled over charcoal.'),
            ('Vegetable Stroganoff', 'Italian', 340, True, 'Sautéed mushrooms, bell peppers, and carrots in a creamy sauce, served with buttered herb rice.'),
            ('Sizzling Chocolate Brownie', 'Desserts', 220, True, 'Warm fudge brownie topped with vanilla ice cream, served on a sizzling hot iron plate with hot chocolate fudge sauce.'),
        ]
    },

    # Telangana (Hyderabad)
    {
        'name': 'Paradise Biryani',
        'cuisine': 'Biryani, North Indian',
        'address': 'SD Road, Secunderabad, Hyderabad',
        'city': 'Hyderabad',
        'state': 'Telangana',
        'pincode': '500003',
        'phone': '04066661166',
        'email': 'customercare@paradisefoods.in',
        'image': 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Paradise+Biryani,+Secunderabad,+Hyderabad',
        'description': 'Operating since 1953, Paradise is globally recognized as the gold standard of Hyderabadi Dum Biryani, serving royal recipes cooked over charcoal.',
        'average_rating': 4.8,
        'total_reviews': 310,
        'menu': [
            ('Special Chicken Dum Biryani', 'Biryani', 360, False, 'Fragrant, long basmati rice layered with succulent marinated chicken, saffron, and whole spices, cooked slowly on dum.'),
            ('Double Masala Mutton Biryani', 'Biryani', 410, False, 'Extra-flavorful layered rice biryani with rich, spiced masala gravy and tender mutton chunks.'),
            ('Chicken Garlic Tikka', 'North Indian', 320, False, 'Boneless chicken cubes marinated in garlic paste, yogurt, and green chilies, baked to a tender finish in a clay tandoor.'),
            ('Mirchi ka Salan', 'North Indian', 80, True, 'Traditional Hyderabadi spicy gravy made from peanuts, sesame seeds, coconut, and large green chilies, served as an accompaniment.'),
            ('Qubani Ka Meetha', 'Desserts', 140, True, 'Classic Hyderabadi sweet dish made from slow-stewed dried apricots, served with fresh cream.'),
        ]
    },

    # Tamil Nadu (Chennai)
    {
        'name': 'Saravana Bhavan',
        'cuisine': 'South Indian',
        'address': '12, North Mada Street, Mylapore, Chennai',
        'city': 'Chennai',
        'state': 'Tamil Nadu',
        'pincode': '600004',
        'phone': '04424615558',
        'email': 'mylapore@saravanabhavan.com',
        'image': 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Saravana+Bhavan,+Mylapore,+Chennai',
        'description': 'A pioneering global South Indian vegetarian dining chain, famous for serving highly standardized, high-quality traditional meals, idlis, and crispy dosas.',
        'average_rating': 4.4,
        'total_reviews': 165,
        'menu': [
            ('Saravana Special Meals (Thali)', 'South Indian', 220, True, 'Traditional grand lunch platter containing rice, sambar, rasam, kootu, poriyal, special kara kuzhambu, curd, appalam, and payasam.'),
            ('Paper Roast Masala Dosa', 'South Indian', 140, True, 'Extra-thin, crispy, giant rice crepe rolled with potato masala, served with coconut, tomato, and coriander chutneys.'),
            ('Ghee Mini Idlis (14 pcs)', 'South Indian', 110, True, 'Tiny steamed button idlis floated in a large bowl of piping hot ghee-infused sambar, topped with coriander leaves.'),
            ('Medhu Vada (2 pcs)', 'South Indian', 70, True, 'Deep-fried, crispy, savory lentil doughnuts served with fresh coconut chutney and hot sambar.'),
            ('Sweet Pongal', 'Desserts', 80, True, 'Traditional rice-and-lentil pudding cooked with milk, jaggery, cardamom, and loaded with cashews roasted in pure ghee.'),
        ]
    },

    # Goa (Panaji)
    {
        'name': "Mum's Kitchen",
        'cuisine': 'Seafood, South Indian',
        'address': '854, Martin\'s Building, D.B. Street, Miramar, Panaji, Goa',
        'city': 'Panaji',
        'state': 'Goa',
        'pincode': '403001',
        'phone': '09822175556',
        'email': 'info@mumskitchengoa.com',
        'image': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Mums+Kitchen,+Panaji,+Goa',
        'description': 'An award-winning restaurant dedicated to preserving and serving the traditional, homestyle recipes of Goan mothers, blending Christian and Hindu coastal cuisines.',
        'average_rating': 4.6,
        'total_reviews': 90,
        'menu': [
            ('Goan Fish Curry Rice', 'Seafood', 520, False, 'Traditional Goan fish curry prepared with fresh local catch, ground coconut paste, and dried red chilies, served with red rice.'),
            ('Goan Pork Vindaloo', 'Seafood', 480, False, 'Classic, tangy, and fiery Goan pork dish marinated in vinegar, garlic, ginger, and hot Mathania red chilies.'),
            ('Prawn Temprado', 'Seafood', 490, False, 'Fresh prawns cooked in a rich, mildly spiced coconut milk gravy with green chilies, ginger, and turmeric.'),
            ('Bebinca', 'Desserts', 180, True, 'Legendary multi-layered baked Goan sweet cake made from coconut milk, egg yolks, sugar, and nutmeg.'),
            ('Goan Poi Bread (2 pcs)', 'South Indian', 50, True, 'Traditional local Goan round wheat bran pocket bread baked in wood-fired clay ovens.'),
        ]
    },

    # Rajasthan (Jaipur)
    {
        'name': 'LMB (Laxmi Mishthan Bhandar)',
        'cuisine': 'North Indian, Street Food',
        'address': '100, Johri Bazar Road, Johri Bazar, Jaipur',
        'city': 'Jaipur',
        'state': 'Rajasthan',
        'pincode': '302003',
        'phone': '01412565844',
        'email': 'lmb@laxmimishthanbhandar.com',
        'image': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Laxmi+Mishthan+Bhandar,+Johri+Bazar,+Jaipur',
        'description': 'Founded in 1727, LMB is a legendary vegetarian sweet shop and heritage restaurant in the pink city walled market, famous for Pyaaz Kachori and Royal Rajasthani Thali.',
        'average_rating': 4.5,
        'total_reviews': 175,
        'menu': [
            ('Royal Rajasthani Thali', 'North Indian', 490, True, 'Grand Rajasthani platter containing Dal, Baati, Churma, Gatte ki Sabzi, Ker Sangri, Lehsun Ki Chutney, Missi Roti, and sweets.'),
            ('LMB Special Pyaaz Kachori', 'Street Food', 85, True, 'Flaky, deep-fried puff pastry stuffed with a highly spiced, tangy onion-potato mixture, served with sweet tamarind chutney.'),
            ('Paneer Ghewar (500g)', 'Desserts', 250, True, 'Traditional disc-shaped honeycomb sweet cake made of flour, ghee, and milk, soaked in cardamom syrup and topped with fresh rabri and dry fruits.'),
            ('Ker Sangri', 'North Indian', 320, True, 'Unique traditional Rajasthani dish made of dried desert berries (ker) and wild beans (sangri) sautéed in yogurt and spices.'),
            ('Aloo Tikki Chaat', 'Street Food', 130, True, 'Crispy pan-fried potato patties topped with spiced chickpeas, yogurt, fresh mint, and tamarind chutneys.'),
        ]
    },

    # Uttar Pradesh (Lucknow)
    {
        'name': 'Tunday Kababi',
        'cuisine': 'North Indian, Street Food',
        'address': '168/6, Naaz Cinema Road, Aminabad, Lucknow',
        'city': 'Lucknow',
        'state': 'Uttar Pradesh',
        'pincode': '226018',
        'phone': '09839023023',
        'email': 'tunday@tundaykababi.co.in',
        'image': 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Tunday+Kababi,+Aminabad,+Lucknow',
        'description': 'A historic, world-renowned culinary treasure of Awadh, celebrated since 1905 for its secret-recipe Galouti Kebabs that melt instantly in the mouth.',
        'average_rating': 4.8,
        'total_reviews': 290,
        'menu': [
            ('Mutton Galouti Kebab (4 pcs)', 'Street Food', 240, False, 'Lucknow\'s legendary melt-in-the-mouth minced mutton patties, flavored with a secret blend of 160 Awadhi spices.'),
            ('Ulta Tawa Paratha', 'North Indian', 40, True, 'Slightly sweet, soft, dome-shaped baked tawa flatbread, the traditional accompaniment to Galouti kebabs.'),
            ('Awadhi Chicken Biryani', 'Biryani', 320, False, 'Fragrant long basmati rice cooked in milk, ghee, saffron, and tender chicken chunks, slow-cooked in traditional Awadhi dum style.'),
            ('Tunday Mutton Boti Kabab', 'Street Food', 280, False, 'Boneless mutton chunks marinated in yogurt, raw papaya, and spices, skewered and grilled over charcoal.'),
            ('Royal Kheer', 'Desserts', 90, True, 'Creamy, rich slow-cooked rice pudding flavored with cardamom, saffron, and loaded with almond slivers.'),
        ]
    },

    # GUJARAT RESTAURANTS

    # Ahmedabad
    {
        'name': 'Agashiye',
        'cuisine': 'Gujarati, Street Food',
        'address': 'The House of MG, Opp. Sidi Saiyyed Mosque, Lal Darwaja, Ahmedabad',
        'city': 'Ahmedabad',
        'state': 'Gujarat',
        'pincode': '380001',
        'phone': '07925506946',
        'email': 'agashiye@houseofmg.com',
        'image': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Agashiye,+Lal+Darwaja,+Ahmedabad',
        'description': 'A stunning open-air terrace heritage restaurant serving unlimited, premium Gujarati thalis with a focus on seasonal and authentic regional delicacies.',
        'average_rating': 4.8,
        'total_reviews': 195,
        'menu': [
            ('Deluxe Gujarati Thali', 'Gujarati', 850, True, 'A grand, unlimited heritage thali showcasing authentic farsans, local curries, flatbreads, khichdi, kadhi, and sweets.'),
            ('Methi Na Gota', 'Street Food', 120, True, 'Spiced, deep-fried fresh fenugreek leaf fritters, soft on the inside and crispy outside, served with green chilies.'),
            ('Agashiye Special Khichdi', 'Gujarati', 240, True, 'Slow-cooked comforting rice and yellow lentil mash finished with pure ghee and served with spiced yogurt kadhi.'),
            ('Gujarati Kesar Basundi', 'Desserts', 180, True, 'Rich, thickened sweet milk reduction flavored with saffron, cardamom, and chopped pistachios.'),
            ('Tempered Masala Chaas', 'Cafe', 60, True, 'Cool, refreshing spiced buttermilk tempered with mustard seeds, curry leaves, and cumin.'),
        ]
    },
    {
        'name': 'Gopi Dining Hall',
        'cuisine': 'Gujarati, North Indian',
        'address': 'Opp. Town Hall, Ashram Road, Ellisbridge, Ahmedabad',
        'city': 'Ahmedabad',
        'state': 'Gujarat',
        'pincode': '380006',
        'phone': '07926576388',
        'email': 'gopidining@yahoo.com',
        'image': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Gopi+Dining+Hall,+Ashram+Road,+Ahmedabad',
        'description': 'Serving authentic Gujarati and Kathiyawadi dining experiences since 1979. Gopi is a local household favorite known for organic, farm-fresh local flavors.',
        'average_rating': 4.5,
        'total_reviews': 88,
        'menu': [
            ('Standard Gujarati Thali', 'Gujarati', 320, True, 'A wholesome daily platter featuring 3 vegetables, choice of rotli/rotla, dal/kadhi, rice, farsan, and sweet.'),
            ('Kathiyawadi Ringan No Oro', 'Gujarati', 180, True, 'Traditional roasted eggplant mash cooked with green garlic, onions, tomatoes, and regional spices.'),
            ('Sukhdi', 'Desserts', 90, True, 'Traditional sweet squares made of whole wheat flour, pure ghee, and jaggery, served warm.'),
            ('Bhakhri with Garlic Chutney', 'Gujarati', 80, True, 'Thick, crispy flatbread made of coarse wheat flour, served with hot spicy garlic-chili paste.'),
            ('Sew Tameta Nu Shaak', 'Gujarati', 160, True, 'Tangy and sweet tomato curry topped with crispy gram flour sev noodles.'),
        ]
    },

    # Surat
    {
        'name': 'Kansar Gujarati Thali',
        'cuisine': 'Gujarati, Street Food',
        'address': 'Ring Road, Opp. Multistoried Building, Nanpura, Surat',
        'city': 'Surat',
        'state': 'Gujarat',
        'pincode': '395001',
        'phone': '02612470123',
        'email': 'kansarsurat@gmail.com',
        'image': 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Kansar+Gujarati+Thali,+Nanpura,+Surat',
        'description': 'One of the best dining halls in Surat to experience a lavish, authentic, and unlimited Gujarati thali containing regional Surati specialties.',
        'average_rating': 4.6,
        'total_reviews': 105,
        'menu': [
            ('Unlimited Surati Gujarati Thali', 'Gujarati', 380, True, 'Lavish spread containing special Surati curries, seasonal Undhiyu, farsans like Locho, flatbreads, and traditional sweets.'),
            ('Surati Locho', 'Street Food', 90, True, 'Traditional steamed, savory chickpea flour snack served loose, topped with oil, butter, and special locho masala.'),
            ('Surati Ghari (2 pcs)', 'Desserts', 140, True, 'Surat\'s famous sweet made of mawa, pistachios, and almonds, covered in a clarified butter (ghee) crust.'),
            ('Fafda with Kadhi', 'Street Food', 100, True, 'Crispy gram-flour strips served with warm, sweet and sour chickpea flour kadhi gravy and green papaya salad.'),
            ('Aamras (Seasonal)', 'Desserts', 120, True, 'Fresh, sweet mango pulp squeezed from Alphonso mangoes, served chilled.'),
        ]
    },
    {
        'name': 'Sardar Bhaji Pav',
        'cuisine': 'Street Food, Pizza',
        'address': 'LP Savani Road, Adajan, Surat',
        'city': 'Surat',
        'state': 'Gujarat',
        'pincode': '395009',
        'phone': '09825123456',
        'email': 'sardar.adajan@yahoo.com',
        'image': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Sardar+Bhaji+Pav,+Adajan,+Surat',
        'description': 'A highly popular local joint in Surat, celebrated for serving buttery, spicy Mumbai-style Bhaji Pav, cheese pulav, and pizzas.',
        'average_rating': 4.3,
        'total_reviews': 72,
        'menu': [
            ('Amul Cheese Bhaji Pav', 'Street Food', 160, True, 'Spicy, butter-rich mixed vegetable mash cooked on a flat tawa, loaded with cheddar cheese, served with butter-toasted pav.'),
            ('Sardar Butter Pulav', 'Street Food', 140, True, 'Wok-tossed basmati rice cooked with butter, green peas, carrots, and special bhaji pav spices.'),
            ('Double Cheese Margherita Pizza', 'Pizza', 200, True, 'Simple, local-style pizza loaded with tomato sauce and double layers of processed Amul cheese.'),
            ('Masala Pav (2 pcs)', 'Street Food', 80, True, 'Soft pav rolls stuffed with a spicy onion-tomato masala paste, cooked in butter.'),
            ('Chiku Milkshake', 'Cafe', 90, True, 'Thick milkshake made from fresh sapodilla (chiku) pulp, milk, and sugar, served cold.'),
        ]
    },

    # Vadodara
    {
        'name': 'Mandap',
        'cuisine': 'Gujarati, North Indian',
        'address': 'Hotel Express Alkapuri, Alkapuri Towers, Alkapuri, Vadodara',
        'city': 'Vadodara',
        'state': 'Gujarat',
        'pincode': '390007',
        'phone': '02652330960',
        'email': 'mandap@expresshotels.com',
        'image': 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Mandap+Restaurant,+Express+Alkapuri,+Vadodara',
        'description': 'Operating inside the Express Towers, Mandap is Vadodara\'s premiere heritage dining hall since 1974, known for its elegant ambiance and authentic Gujarati thalis.',
        'average_rating': 4.7,
        'total_reviews': 115,
        'menu': [
            ('Express Heritage Thali', 'Gujarati', 420, True, 'Premium dining thali presenting a curated assortment of starters, 4 seasonal curries, sweet kadhi, rice, and traditional sweets.'),
            ('Mandap Special Dhokla', 'Street Food', 80, True, 'Light, spongy steamed chickpea flour cakes tempered with mustard seeds, curry leaves, and sesame.'),
            ('Kesar Shrikhand', 'Desserts', 110, True, 'Thick, creamy strained sweet yogurt flavored with saffron, green cardamom, and pistachio slivers.'),
            ('Puris with Aloo Raswala', 'Gujarati', 160, True, 'Puffed deep-fried wheat breads served with a tangy, spiced potato and tomato broth.'),
            ('Jalebi (4 pcs)', 'Desserts', 90, True, 'Crispy, deep-fried flour batters soaked in warm sugar syrup, served piping hot.'),
        ]
    },
    {
        'name': 'Mahakali Sev Usal',
        'cuisine': 'Street Food',
        'address': 'Opp. Kirti Stambh, Palace Road, Vadodara',
        'city': 'Vadodara',
        'state': 'Gujarat',
        'pincode': '390001',
        'phone': '09426343542',
        'email': 'mahakalisevusal@gmail.com',
        'image': 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=Mahakali+Sev+Usal,+Palace+Road,+Vadodara',
        'description': 'The absolute legendary pioneer of Sev Usal in Vadodara, famous for serving bowls of fiery dried-peas curry topped with crispy chickpea noodles (sev) and soft pav.',
        'average_rating': 4.5,
        'total_reviews': 150,
        'menu': [
            ('Butter Sev Usal', 'Street Food', 90, True, 'Spicy, hot dried-peas curry simmered in spices, topped with butter, crunchy sev, spring onions, served with soft buns.'),
            ('Cheese Sev Usal', 'Street Food', 120, True, 'The signature spicy peas usal topped with a thick layer of grated processed cheese and crispy sev.'),
            ('Tari Double Pav', 'Street Food', 40, True, 'Two soft pav rolls served floated inside a bowl of extra-hot spiced oil broth (tari).'),
            ('Farali Sev Usal', 'Street Food', 100, True, 'A fasting-friendly version of sev usal made with tapioca pearls and potato base, topped with sago sev.'),
            ('Masala Soda', 'Cafe', 40, True, 'Refreshing carbonated water mixed with lime, black salt, and roasted cumin powder.'),
        ]
    },

    # Rajkot
    {
        'name': 'The Grand Thakar',
        'cuisine': 'Gujarati, North Indian, Cafe',
        'address': 'Jubilee Chowk, Jawahar Road, Jubilee Garden, Rajkot',
        'city': 'Rajkot',
        'state': 'Gujarat',
        'pincode': '360001',
        'phone': '02812222999',
        'email': 'info@thegrandthakar.com',
        'image': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        'google_maps_link': 'https://www.google.com/maps/embed/v1/place?key=&q=The+Grand+Thakar,+Jubilee+Garden,+Rajkot',
        'description': 'A renowned culinary destination in Rajkot, celebrated for its premium Kathiyawadi thalis, spicy North Indian curries, and traditional hospitality.',
        'average_rating': 4.6,
        'total_reviews': 130,
        'menu': [
            ('Kathiyawadi Special Thali', 'Gujarati', 350, True, 'Rich regional thali showcasing Ringan No Oro, Sev Tameta, Garlic Chutney, millet flatbreads (Rotla), and sweet jaggery ghee.'),
            ('Ringan No Oro (Baingan Bharta)', 'Gujarati', 180, True, 'Smoked roasted eggplant mash cooked with green garlic, green chilies, and pure peanut oil.'),
            ('Dry Fruit Lassi', 'Desserts', 120, True, 'Thick, creamy sweet yogurt blended with rose water and topped with almonds, cashews, and pistachios.'),
            ('Vagharelo Rotlo', 'Gujarati', 150, True, 'Traditional millet flatbread crumbled and sautéed with yogurt, mustard seeds, curry leaves, and green garlic.'),
            ('Spiced Masala Chaas', 'Cafe', 40, True, 'Chilled churned yogurt drink mixed with mint leaves, coriander, green chilies, and roasted cumin.'),
        ]
    }
]

for rd in RESTAURANTS:
    menu = rd.pop('menu')
    # Create or update restaurant
    r, created = Restaurant.objects.update_or_create(
        name=rd['name'],
        defaults={
            **rd,
            'owner': admin_user,
            'status': 'approved',
            'is_active': True,
            'opening_time': time(11, 0),
            'closing_time': time(23, 0),
        }
    )
    action = "Created" if created else "Updated"
    print(f"  + {action} Restaurant: {r.name} ({r.city})")

    # Create menu items
    for fname, cat_name, price, is_veg, desc in menu:
        Food.objects.update_or_create(
            name=fname,
            restaurant=r,
            defaults={
                'category': cats.get(cat_name),
                'price': price,
                'is_veg': is_veg,
                'is_available': True,
                'description': desc,
            }
        )
    print(f"    ✓ {len(menu)} menu items seeded")

print("\n✅ Real restaurants and menus seeded successfully across major cities in India and Gujarat!")
