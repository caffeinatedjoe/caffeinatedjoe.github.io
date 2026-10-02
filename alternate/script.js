"use strict";

var SHEET_URL = "https://docs.google.com/spreadsheets/d/1hNxU4YCmZZ5uRfq8_eHUwLspzNWncJzmdclrzYAGlvM/pub?output=csv";

var SWATCHES = ["#2a2420", "#243028", "#2c2430", "#1e2a30", "#302418", "#242830", "#2a221c", "#1c2824"];

// Sheet title|author keys that should show a different jacket than the literal filename.
// Entries after the Bible are one-off sheet typos (and "work week" vs Workweek).
var COVER_ALIASES = {
  "bible|various": "Holy Bible (ESV) -- Various.jpg",
  "adapt|tim hartford": "Adapt -- Tim Harford.jpg",
  "age of opportunity|paul trip": "Age of Opportunity -- Paul Tripp.jpg",
  "bossypants|tiny fey": "Bossypants -- Tina Fey.jpg",
  "expeditionary foce breakaway|craig alanson": "Expeditionary Force Breakaway -- Craig Alanson.jpg",
  "miss peregrine's home for peculiar children|ranson riggs": "Miss Peregrine's Home for Peculiar Children -- Ransom Riggs.jpg",
  "outlive|peter atia": "Outlive -- Peter Attia.jpg",
  "pride and predujice|jane austen": "Pride and Prejudice -- Jane Austen.jpg",
  "red team blues|cory doctoroy": "Red Team Blues -- Cory Doctorow.jpg",
  "rhythms of war|brandon sanderson": "Rhythm of War -- Brandon Sanderson.jpg",
  "salt|mark kulansky": "Salt -- Mark Kurlansky.jpg",
  "the 4-hour work week|tim ferriss": "The 4-Hour Workweek -- Tim Ferriss.jpg",
  "the data detective|tim hartford": "The Data Detective -- Tim Harford.jpg",
  "the frugal wizard's handbook for surviving medival england|brandon sanderson": "The Frugal Wizard's Handbook for Surviving Medieval England -- Brandon Sanderson.jpg",
  "the great gasby|f. scott fitzgerald": "The Great Gatsby -- F. Scott Fitzgerald.jpg",
  "the one|john mars": "The One -- John Marrs.jpg",
  "this is how you lose the time war|armal el-mohtar": "This is How You Lose The Time War -- Amal El-Mohtar.jpg"
};

var DISPLAY_TITLES = {
  "bible|various": "Holy Bible (ESV)"
};

// NASB jacket shipped in the archive. Bible rows use the ESV file above.
var IGNORED_COVERS = {
  "Bible -- Various.jpg": true
};

var COVER_FILES = [
  "14 -- Peter Clines.jpg",
  "1984 -- George Orwell.jpg",
  "A City on Mars -- Kelly Weinersmith.jpg",
  "A Clash of Kings -- George R. R. Martin.jpg",
  "A Darker Shade of Magic -- V.E. Schwab.jpg",
  "A Fire Upon the Deep -- Vernor Vinge.jpg",
  "A Game of Thrones -- George R. R. Martin.jpg",
  "A Hat Full of Sky -- Terry Pratchett.jpg",
  "A Memory Called Empire -- Arkady Martine.jpg",
  "A Mind at Play -- Rob Goodman.jpg",
  "A Most Agreeable Murder -- Julia Seales.jpg",
  "A Wizard of Earthsea -- Ursula Le Guin.jpg",
  "A feast for crows -- George RR Martin.jpg",
  "ADHD is Awesome -- Penn Holderness.jpg",
  "Abaddon's Gate -- James Corey.jpg",
  "Across the Airless Wilds -- Earl Swift.jpg",
  "Adapt -- Tim Harford.jpg",
  "Aftermath -- Craig Alanson.jpg",
  "Age of Opportunity -- Paul Tripp.jpg",
  "Airframe -- Michael Crichton.jpg",
  "Alcatraz Versus the Evil Librarians -- Brandon Sanderson.jpg",
  "Alex Rider Stormbreaker -- Anthony Horowitz.jpg",
  "Algorithms to Live By The Computer Science of Human Decisions -- Brian Christian.jpg",
  "All Systems Red -- Martha Wells.jpg",
  "All These Worlds Bobiverse, Book 3 -- Dennis E. Taylor.jpg",
  "All by myself alone -- Mary Higgins Clark.jpg",
  "American Sniper -- Chris Kyle.jpg",
  "An Unwelcome Quest Magic 2.0, Book 3 -- Scott Meyer.jpg",
  "Angry with God -- Peter Gasiorowski.jpg",
  "Animal Farm -- George Orwell.jpg",
  "Arcanum Unbounded -- Brandon Sanderson.jpg",
  "Armada -- Ernest Cline.jpg",
  "Artemis -- Andy Weir.jpg",
  "Artificial Condition -- Martha Wells.jpg",
  "As You Wish -- Cary Elwes.jpg",
  "At the Mountains of Madness -- H.P. Lovecraft.jpg",
  "Atomic Habits -- James Clear.jpg",
  "Babylon's Ashes -- James Corey.jpg",
  "Bad Blood -- John Carreyrou.jpg",
  "Bad Therapy -- Abigail Shrier.jpg",
  "Bands of Mourning -- Brandon Sanderson.jpg",
  "Bible -- Various.jpg",
  "Big Bets -- Rajiv Shah.jpg",
  "Birds of a Feather -- Jacqueline Winspear.jpg",
  "Black Box Thinking -- Matthew Syed.jpg",
  "Blink The Power of Thinking Without Thinking -- Malcolm Gladwell.jpg",
  "Blockchain The Next Everything -- Stephen P. Williams.jpg",
  "Blood, Sweat, and Pixels -- Jason Schreier.jpg",
  "Blue Ocean Strategy -- W. Chan Kim.jpg",
  "Bossypants -- Tina Fey.jpg",
  "Brave New World -- Aldous Huxley.jpg",
  "Breath -- James Nestor.jpg",
  "Brisingr -- Christopher Paolini.jpg",
  "Build -- Tony Fadell.jpg",
  "Building a Story Brand -- Donald Miller.jpg",
  "Burn the boats -- Matt Higgins.jpg",
  "Caliban's War -- James Corey.jpg",
  "Can We Be Good Without God A Conversation about Truth, Morality, Cultu -- Paul Chamberlain.jpg",
  "Can't Hurt Me -- David Goggins.jpg",
  "Capital Gaines The Smart Things I've Learned by Doing Stupid Stuff -- Chip Gaines.jpg",
  "Cassandra in Reverse -- Holly Smale.jpg",
  "Change Agent -- Daniel Suarez.jpg",
  "Children of Memory -- Adrian Tchaikovsky.jpg",
  "Children of Ruin -- Adrian Tchaikovsky.jpg",
  "Children of Time -- Adrian Tchaikovsky.jpg",
  "Cibola Burn -- James Corey.jpg",
  "Complexity -- M. Mitchell Waldrop.jpg",
  "Complications -- Atul Gawande.jpg",
  "Console Wars Sega, Nintendo, and the Battle That Defined a Generation -- Blake Harris.jpg",
  "Create -- Marc Silber.jpg",
  "Creative Selection -- Ken Kocienda.jpg",
  "Creativity -- John Cleese.jpg",
  "Creativity, Inc. Overcoming the Unseen Forces That Stand in the Way of -- Ed Catmull.jpg",
  "Critical Mass -- Daniel Suarez.jpg",
  "Crux -- Ramez Naam.jpg",
  "Cryptonomicon -- Neal Stephenson.jpg",
  "Customerized Selling -- Phil Kreindler.jpg",
  "Cytonic -- Brandon Sanderson.jpg",
  "Daemon -- Daniel Suarez.jpg",
  "Dare to Lead -- Brene Brown.jpg",
  "Dark Age -- Pierce Brown.jpg",
  "Dark Clouds, Deep Mercy -- Mark Vroegop.jpg",
  "Dark Matter -- Blake Crouch.jpg",
  "Darwin Devolves -- Michael J. Behe.jpg",
  "Daughter of the Deep -- Rick Riordan.jpg",
  "David and Goliath -- Malcolm Gladwell.jpg",
  "Dawnshard -- Brandon Sanderson.jpg",
  "Decision Points -- George W Bush.jpg",
  "Deep State -- Chris Hauty.jpg",
  "Deeper Real Change for Real Sinners -- Dane Ortlund.jpg",
  "Defeating Evil -- M. Scott Christensen.jpg",
  "Defending Jacob -- William Landay.jpg",
  "Defiant -- Brandon Sanderson.jpg",
  "Delivering Happiness A Path to Profits, Passion, and Purpose -- Tony Hsieh.jpg",
  "Delta-v -- Daniel Suarez.jpg",
  "Die Trying -- Lee Child.jpg",
  "DisneyWar -- James Stewart.jpg",
  "Do More Better -- Tim Challies.jpg",
  "Dopamine Nation -- Dr. Anna Lembke.jpg",
  "Dragon Teeth -- Michael Crichton.jpg",
  "Dragonfired -- J. Zachary Pike.jpg",
  "Dry -- Neal Shusterman.jpg",
  "Dune -- Frank Herbert.jpg",
  "Dungeon Crawler Carl -- Matt Dinniman.jpg",
  "Dust -- Hugh Howey.jpg",
  "Eat that Frog! -- Brian Tracy.jpg",
  "Educated -- Tara Westover.jpg",
  "Einstein -- Walter Isaacson.jpg",
  "Elantris -- Brandon Sanderson.jpg",
  "Eldest -- Christopher Paolini.jpg",
  "Elon Musk -- Walter Isaacson.jpg",
  "Elon Musk Tesla, SpaceX, and the Quest for a Fantastic Future -- Ashlee Vance.jpg",
  "Ender's Game (Ender's Saga, #1) -- Orson Scott Card.jpg",
  "Ender's Game -- Orson Scott Card.jpg",
  "Eragon -- Christopher Paolini.jpg",
  "Escaping the Build Trap -- Melissa Perri.jpg",
  "Every Tool's a Hammer -- Adam Savage.jpg",
  "Everybody Lies -- Seth Stephens-Davidowitz.jpg",
  "Everything is Never Enough -- Bobby Jamieson.jpg",
  "Exit Strategy -- Martha Wells.jpg",
  "Expeditionary Force Armageddon -- Craig Alanson.jpg",
  "Expeditionary Force Black Ops -- Craig Alanson.jpg",
  "Expeditionary Force Breakaway -- Craig Alanson.jpg",
  "Expeditionary Force Brushfire -- Craig Alanson.jpg",
  "Expeditionary Force Columbus Day -- Craig Alanson.jpg",
  "Expeditionary Force Critical Mass -- Craig Alanson.jpg",
  "Expeditionary Force Gateway -- Craig Alanson.jpg",
  "Expeditionary Force Match Game -- Craig Alanson.jpg",
  "Expeditionary Force Mavericks -- Craig Alanson.jpg",
  "Expeditionary Force Paradise -- Craig Alanson.jpg",
  "Expeditionary Force Renegades -- Craig Alanson.jpg",
  "Expeditionary Force SpecOps -- Craig Alanson.jpg",
  "Expeditionary Force Trouble on Paradise -- Craig Alanson.jpg",
  "Expeditionary Force Valkyrie -- Craig Alanson.jpg",
  "Expeditionary Force Zero Hour -- Craig Alanson.jpg",
  "Extreme Ownership -- Jocko Willink.jpg",
  "Failure Is Not an Option -- Gene Kranz.jpg",
  "Failure Mode -- Craig Alanson.jpg",
  "Farmer in the Sky -- Robert Heinlein.jpg",
  "Fight and Flight Magic 2.0, Book 4 -- Scott Meyer.jpg",
  "Final Orbit -- Chris Hadfield.jpg",
  "Finding Your Why -- Simon Sinek.jpg",
  "First Man The Life of Neil A. Armstrong -- James R. Hansen.jpg",
  "Flybot -- Dennis E. Taylor.jpg",
  "Focus -- Daniel Goleman.jpg",
  "For We Are Many Bobiverse, Book 2 -- Dennis E. Taylor.jpg",
  "Freakonomics A Rogue Economist Explores the Hidden Side of Everything -- Steven D. Levitt.jpg",
  "Freedom (TM) -- Daniel Suarez.jpg",
  "Fuzzy Nation -- John Scalzi.jpg",
  "Game of Nines -- James Patterson.jpg",
  "Genome -- Matt Ridley.jpg",
  "Getting to Yes Negotiating an Agreement Without Giving In -- Roger Fisher.jpg",
  "Ghost Fleet -- P.W. Singer.jpg",
  "Going Postal -- Terry Pratchett.jpg",
  "Golden Son Book II of the Red Rising Trilogy -- Pierce Brown.jpg",
  "Good to Great Why Some Companies Make the Leap... and Others Don't -- James C. Collins.jpg",
  "Googled The End of the World As We Know It -- Ken Auletta.jpg",
  "Grace Based Parenting -- Tim Kimmel.jpg",
  "Greenlights -- Matthew McConaughey.jpg",
  "Grit The Power of Passion and Perseverance -- Angela Duckworth.jpg",
  "Ground State -- Craig Alanson.jpg",
  "Habits of the Household -- Justin Earley.jpg",
  "Harry Potter -- JK Rowling.jpg",
  "Harry Potter and the Chamber of Secrets -- J.K. Rowling.jpg",
  "Harry Potter and the Deathly Hallows -- J.K. Rowling.jpg",
  "Harry Potter and the Goblet of Fire -- J.K. Rowling.jpg",
  "Harry Potter and the Half-Blood Prince -- J.K. Rowling.jpg",
  "Harry Potter and the Order of the Phoenix -- J.K. Rowling.jpg",
  "Harry Potter and the Prisoner of Azkaban -- J.K. Rowling.jpg",
  "Harry Potter and the Sorcerer's Stone -- JK Rowling.jpg",
  "Head On -- John Scalzi.jpg",
  "Heaven's River Bobiverse, Book 4 -- Dennis E. Taylor.jpg",
  "Heir of Novron Riyria Revelations, Volume 3 -- Michael J. Sullivan.jpg",
  "Hickory Dickory Dock -- Agatha Christie.jpg",
  "Hollow -- Ransom Riggs.jpg",
  "Holy Bible (ESV) -- Various.jpg",
  "How High We Go in the Dark -- Sequoia Nagamatsu.jpg",
  "How Not to Be Wrong -- Jordan Ellenberg.jpg",
  "How to Fail at Almost Everything and Still Win Big Kind of the Story o -- Scott Adams.jpg",
  "How to Solve Your Own Murder -- Kristen Perrin.jpg",
  "How to be a Great Boss -- Gino Wickman.jpg",
  "Humble Pi A Comedy of Maths Errors -- Matt Parker.jpg",
  "Ignition! -- John Drury Clark.jpg",
  "In-N-Out Burger -- Stacy Perman.jpg",
  "Infinite -- Jeremy Robinson.jpg",
  "Influx -- Daniel Suarez.jpg",
  "Inheritance -- Christopher Paolini.jpg",
  "Innovation On Tap -- Eric B. Shultz.jpg",
  "Inside the Box -- David Epstein.jpg",
  "Invent and Wander -- Walter Isaacson.jpg",
  "Iron Gold -- Pierce Brown.jpg",
  "Isles of the Emberdark -- Brandon Sanderson.jpg",
  "It Doesn't Have to be Crazy at Work -- Jason Fried.jpg",
  "Jesus, Continued Why the Spirit Inside You is Better than Jesus Beside -- J.D. Greear.jpg",
  "Kerplunk -- Patrick F McManus.jpg",
  "Kill Decision -- Daniel Suarez.jpg",
  "Killing Floor -- Lee Child.jpg",
  "Learn Like A Pro -- Dr. Barbara Oakley.jpg",
  "Leonardo Da Vinci -- Walter Isaacson.jpg",
  "Leviathan Falls -- James Corey.jpg",
  "Leviathan Wakes -- James Corey.jpg",
  "Library of Souls -- Ransom Riggs.jpg",
  "Liftoff Elon Musk and the Desperate Early Days That Launched SpaceX -- Eric Berger.jpg",
  "Lightbringer -- Pierce Brown.jpg",
  "Listen for the Lie -- Amy Tintera.jpg",
  "Little Bets -- Peter Sims.jpg",
  "Little Things Why You Really Should Sweat the Small Stuff -- Andy Andrews.jpg",
  "Living by the Book -- Howard Hendricks.jpg",
  "Lock In (Narrated by Wil Wheaton) -- John Scalzi.jpg",
  "Lock In -- John Scalzi.jpg",
  "Loonshots -- Safi Bahcall.jpg",
  "Luck by Design -- Adam Tank.jpg",
  "Maisie Dobbs -- Jacqueline Winspear.jpg",
  "Man's Search for Meaning -- Viktor Frankl.jpg",
  "Master of Formalities -- Scott Meyer.jpg",
  "Master of None How a Jack-of-All-Trades Can Still Reach the Top -- Clifford Hudson.jpg",
  "Masters of Doom -- David Kushner.jpg",
  "Memory Man -- David Baldacci.jpg",
  "Mere Christianity -- C.S. Lewis.jpg",
  "Micro -- Michael Crichton.jpg",
  "Miss Peregrine's Home for Peculiar Children -- Ransom Riggs.jpg",
  "Moonwalking with Einstein -- Joshua Foer.jpg",
  "More than Enough The Ten Keys to Changing Your Financial Destiny -- Dave Ramsey.jpg",
  "Morning Star Book III of the Red Rising Trilogy -- Pierce Brown.jpg",
  "Murder on the Orient Express -- Agatha Christie.jpg",
  "Murtagh -- Christopher Paolini.jpg",
  "Nemesis Games -- James Corey.jpg",
  "Neuromancer -- William Gibson.jpg",
  "Never Split the Difference -- Chris Voss.jpg",
  "Neverwhere -- Neil Gaiman.jpg",
  "Nexus -- Ramez Naam.jpg",
  "No Drama Discipline -- Tina Payne.jpg",
  "No Man's Land -- David Baldacci.jpg",
  "No Rules Rules Netflix and the Culture of Reinvention -- Reed Hastings.jpg",
  "None of This is True -- Lisa Jewell.jpg",
  "North! Or Be Eaten Wingfeather Saga 2 -- Andrew Peterson.jpg",
  "Not God Enough -- J.D. Greear.jpg",
  "Not Till We Are Lost Bobiverse, Book 5 -- Dennis E. Taylor.jpg",
  "Oathbringer -- Brandon Sanderson.jpg",
  "Odyssey The Greek Myths Reimagined -- Stephen Fry.jpg",
  "Off Armageddon Reef -- David Weber.jpg",
  "Off to Be the Wizard -- Scott Meyer.jpg",
  "Old Man's War -- John Scalzi.jpg",
  "On the Edge of the Dark Sea of Darkness Wingfeather Saga 1 -- Andrew Peterson.jpg",
  "Onward -- Howard Schultz.jpg",
  "Orconomics -- J. Zachary Pike.jpg",
  "Originals -- Adam Grant.jpg",
  "Out of Spite, Out of Mind Magic 2.0 -- Scott Meyer.jpg",
  "Outliers The Story of Success -- Malcolm Gladwell.jpg",
  "Outlive -- Peter Attia.jpg",
  "Paradime -- Alan Glynn.jpg",
  "Parenting -- Paul David Tripp.jpg",
  "Pattern Recognition -- William Gibson.jpg",
  "Permanent Record -- Edward Snowden.jpg",
  "Persepolis Rising -- James Corey.jpg",
  "Play Bigger How Pirates, Dreamers, and Innovators Create and Dominate -- Al Ramadan.jpg",
  "Point Nemo -- Jeremy Robinson.jpg",
  "Predictably Irrational -- Dan Ariely.jpg",
  "Pride and Prejudice -- Jane Austen.jpg",
  "Prince Caspian -- C.S. Lewis.jpg",
  "Principles -- Ray Dalio.jpg",
  "Project Hail Mary -- Andy Weir.jpg",
  "QBQ! the Question Behind the Question Practicing Personal Accountabili -- John G. Miller.jpg",
  "Quitter Closing the Gap Between Your Day Job and Your Dream Job -- Jon Acuff.jpg",
  "Radical Candor -- Kim Scott.jpg",
  "Radical Taking Back Your Faith from the American Dream -- David Platt.jpg",
  "Range -- David Epstein.jpg",
  "Ready Player One -- Ernest Cline.jpg",
  "Ready Player Two -- Ernest Cline.jpg",
  "Recursion -- Blake Crouch.jpg",
  "Red Rising -- Pierce Brown.jpg",
  "Red Team Blues -- Cory Doctorow.jpg",
  "Redshirts -- John Scalzi.jpg",
  "Reentry -- Eric Berger.jpg",
  "Remarkably Bright Creatures -- Shelby Van Pelt.jpg",
  "Remote Control -- Nnedi Okorafor.jpg",
  "Replay -- Ken Grimwood.jpg",
  "Rework -- Jason Fried.jpg",
  "Rhinoceros Success The Secret to Charging Full Speed Toward Every Oppo -- Scott Alexander.jpg",
  "Rhythm of War -- Brandon Sanderson.jpg",
  "Rift Saga Covenant -- Andreas Christensen.jpg",
  "Rift Saga Legacy -- Andreas Christensen.jpg",
  "Rift Saga Rift -- Andreas Christensen.jpg",
  "Rise of Empire Riyria Revelations, Volume 2 -- Michael J. Sullivan.jpg",
  "Rocket Dreams -- Christian Davenport.jpg",
  "Rogue Protocol -- Martha Wells.jpg",
  "Run Program -- Scott Meyer.jpg",
  "Salt -- Mark Kurlansky.jpg",
  "Saturn Run -- John Sandford.jpg",
  "Seveneves -- Neal Stephenson.jpg",
  "Shadows of Self -- Brandon Sanderson.jpg",
  "Shepherding a Child's Heart -- Tedd Tripp.jpg",
  "Sherlock Holmes -- Arthur Conan Doyle.jpg",
  "Shift -- Hugh Howey.jpg",
  "Shoe Dog -- Phil Knight.jpg",
  "Shroud -- Adrian Tchaikovsky.jpg",
  "Skunk Works A Personal Memoir of My Years of Lockheed -- Ben R. Rich.jpg",
  "Skyward -- Brandon Sanderson.jpg",
  "Smart Money Smart Kids Raising the Next Generation to Win with Money -- Dave Ramsey.jpg",
  "Son of a Liche -- J. Zachary Pike.jpg",
  "Speak with Impact How to Command the Room and Influence Others -- Allison Shapira.jpg",
  "Spell or High Water Magic 2.0 -- Scott Meyer.jpg",
  "Starsight -- Brandon Sanderson.jpg",
  "Start with Why How Great Leaders Inspire Everyone to Take Action -- Simon Sinek.jpg",
  "Starter Villain -- John Scalzi.jpg",
  "Steve Jobs -- Walter Isaacson.jpg",
  "Stranger in a Strange Land -- Robert Heinlein.jpg",
  "SuperFreakonomics Global Cooling, Patriotic Prostitutes And Why Suicid -- Steven D. Levitt.jpg",
  "Talking to Strangers -- Malcolm Gladwell.jpg",
  "Task Force Hammer -- Craig Alanson.jpg",
  "The 4-Hour Workweek -- Tim Ferriss.jpg",
  "The 7 12 Deaths of Evelyn Hardcastle -- Stuart Turton.jpg",
  "The 7.5 Deaths of Evelyn Hardcastle -- Stuart Turton.jpg",
  "The Alchemist -- Paulo Coelho.jpg",
  "The Algorithm -- Jon McNeill.jpg",
  "The Alloy of Law -- Brandon Sanderson.jpg",
  "The Android's Dream -- John Scalzi.jpg",
  "The Andromeda Strain -- Michael Crichton.jpg",
  "The Anxious Generation -- Jonathan Haidt.jpg",
  "The Apollo Murders -- Chris Hadfield.jpg",
  "The Best Place To Work -- Ron Friedman.jpg",
  "The Big Short Inside the Doomsday Machine -- Michael Lewis.jpg",
  "The Bletchley Riddle -- Ruta Sepetys.jpg",
  "The Case Against Sugar -- Gary Taubes.jpg",
  "The Circle -- Dave Eggers.jpg",
  "The Code Breaker -- Walter Isaacson.jpg",
  "The Collapsing Empire -- John Scalzi.jpg",
  "The Complete Husband -- Lou Priolo.jpg",
  "The Consuming Fire -- John Scalzi.jpg",
  "The Cuckoo's Egg -- Cliff Stoll.jpg",
  "The Data Detective -- Tim Harford.jpg",
  "The Deep Learning Revolution -- Terrence J. Sejnowski.jpg",
  "The Defector -- Chris Hadfield.jpg",
  "The Devil in the White City -- Erik Larson.jpg",
  "The Disappearing Spoon -- Sam Kean.jpg",
  "The Dispatcher -- John Scalzi.jpg",
  "The End is Always Near -- Dan Carlin.jpg",
  "The End of All Things -- John Scalzi.jpg",
  "The End of the World is Just the Beginning -- Peter Zeihan.jpg",
  "The Escape -- David Baldacci.jpg",
  "The Extended Mind -- Annie Murphy.jpg",
  "The Eye of the World -- Robert Jordan.jpg",
  "The Faithful Parent -- Martha Peace.jpg",
  "The Fellowship of the Ring -- J.R.R. Tolkien.jpg",
  "The Final Empire -- Brandon Sanderson.jpg",
  "The Fires of December -- Brandon Sanderson.jpg",
  "The First Fifteen Lives of Harry August -- Claire North.jpg",
  "The Five Love Languages Men's Edition How to Express Heartfelt Commitm -- Gary Chapman.jpg",
  "The Fix -- David Baldacci.jpg",
  "The Fold -- Peter Clines.jpg",
  "The Forgotten -- David Baldacci.jpg",
  "The Founders -- Jimmy Soni.jpg",
  "The Four Hour School Day -- Durenda Wilson.jpg",
  "The Frugal Wizard's Handbook for Surviving Medieval England -- Brandon Sanderson.jpg",
  "The Genius Plague -- David Walton.jpg",
  "The Ghost Brigades Old Man's War, Book 2 -- John Scalzi.jpg",
  "The Girl With All the Gifts -- M. R. Carey.jpg",
  "The Girl on the Train A Novel -- Paula Hawkins.jpg",
  "The Giver -- Lois Lowry.jpg",
  "The Go-Getter The Timeless Classic That Tells You How to Be One -- Peter B. Kyne.jpg",
  "The Good Neighbor -- Maxwell King.jpg",
  "The Graveyard Book -- Neil Gaiman.jpg",
  "The Great Gatsby -- F. Scott Fitzgerald.jpg",
  "The Great Hunt -- Robert Jordan.jpg",
  "The Hard Thing About Hard Things Building a Business When There Are No -- Ben Horowitz.jpg",
  "The History of the Future Oculus, Facebook, and the Revolution That Sw -- Blake Harris.jpg",
  "The Hitch-Hiker's Guide to the Galaxy -- Douglas Adams.jpg",
  "The Hobbit -- J.R.R. Tolkien.jpg",
  "The Horse and His Boy -- C.S. Lewis.jpg",
  "The Human Division -- John Scalzi.jpg",
  "The Icarus Deception How High Will You Fly -- Seth Godin.jpg",
  "The Idea Factory Bell Labs and the Great Age of American Innovation -- Jon Gertner.jpg",
  "The Infinite Extent -- Dennis E. Taylor.jpg",
  "The Innovators How a Group of Hackers, Geniuses, and Geeks Created the -- Walter Isaacson.jpg",
  "The Intelligent Investor -- Benjamin Graham.jpg",
  "The Last Battle -- C.S. Lewis.jpg",
  "The Last Colony -- John Scalzi.jpg",
  "The Last Emperox -- John Scalzi.jpg",
  "The Last Lecture -- Randy Pausch.jpg",
  "The Last Mile -- David Baldacci.jpg",
  "The Last Murder at the End of the World -- Stuart Turton.jpg",
  "The Legacy Human -- Susan Kaye Quinn.jpg",
  "The Legend of the Monk and the Merchant Principles for Successful Livi -- Terry Felber.jpg",
  "The Lessons of History -- Will Durant.jpg",
  "The Life-Changing Magic of Tidying Up -- Marie Kondo.jpg",
  "The Lion the Witch and the Wardrobe -- C.S. Lewis.jpg",
  "The Long Walk -- Stephen King.jpg",
  "The Long Way to a Small Angry Planet -- Becky Chambers.jpg",
  "The Lost Metal -- Brandon Sanderson.jpg",
  "The Magician's Nephew -- C.S. Lewis.jpg",
  "The Magnolia Story -- Chip Gaines.jpg",
  "The Martian -- Andy Weir.jpg",
  "The Mathematics of Love -- Hannah Fry.jpg",
  "The Monster in the Hollows Wingfeather Saga 3 -- Andrew Peterson.jpg",
  "The Moon is a Harsh Mistress -- Robert Heinlein.jpg",
  "The Most Human Human What Talking with Computers Teaches Us About What -- Brian Christian.jpg",
  "The Mysterious Benedict Society -- Trenton Lee Stewart.jpg",
  "The Name of the Wind Kingkiller Chronicles -- Patrick Rothfuss.jpg",
  "The Night Agent -- Matthew Quirk.jpg",
  "The Nvidia Way -- Tae Kim.jpg",
  "The One -- John Marrs.jpg",
  "The Parasitic Mind -- Gad Saad.jpg",
  "The Perfectionists -- Simon Winchester.jpg",
  "The Perilous Journey -- Trenton Stewart.jpg",
  "The Pilgrim's Progress -- John Bunyan.jpg",
  "The Pixar Touch The Making of a Company -- David A. Price.jpg",
  "The Player of Games -- Iain Banks.jpg",
  "The Power of Habit Why We Do What We Do in Life and Business -- Charles Duhigg.jpg",
  "The Prisoner's Dilemma -- Trenton Stewart.jpg",
  "The Purpose Driven Life What on Earth Am I Here for -- Rick Warren.jpg",
  "The Return of the King -- J.R.R. Tolkien.jpg",
  "The Ride of a Lifetime -- Robert Iger.jpg",
  "The Running Man -- Stephen King.jpg",
  "The Secret Life of the Mind -- Mariano Sigman.jpg",
  "The Sentence is Death -- Anthony Horowitz.jpg",
  "The Silver Chair -- C.S. Lewis.jpg",
  "The Six Types of Working Genius -- Patrick Lencioni.jpg",
  "The Snowball -- Alice Schroeder.jpg",
  "The Storm of Steel -- Ernst J\u00fcnger.jpg",
  "The Story Behind The Extraordinary History Behind Ordinary Objects -- Emily Prokop.jpg",
  "The Story Thieves -- James Riley.jpg",
  "The Sunlit Man -- Brandon Sanderson.jpg",
  "The Tech-Wise Family -- Andy Crouch.jpg",
  "The Terminal List -- Jack Carr.jpg",
  "The Third Wave An Entrepreneur's Vision of the Future -- Steve Case.jpg",
  "The Three Body Problem -- Cixin Liu.jpg",
  "The Thursday Murder Club -- Richard Osman.jpg",
  "The Tipping Point How Little Things Can Make a Big Difference -- Malcolm Gladwell.jpg",
  "The Two Towers -- J.R.R. Tolkien.jpg",
  "The Utterly Uninteresting and Unadventurous Tales of Fred, the Vampire -- Drew Hayes.jpg",
  "The Vexed Generation -- Scott Meyer.jpg",
  "The Voyage of the Dawn Treader -- C.S. Lewis.jpg",
  "The Warden and the Wolf King Wingfeather Saga 4 -- Andrew Peterson.jpg",
  "The Warren Buffett Way -- Robert Hagstrom.jpg",
  "The Way I Heard It -- Mike Rowe.jpg",
  "The Way of Kings -- Brandon Sanderson.jpg",
  "The Wee Free Men -- Terry Pratchett.jpg",
  "The Well of Ascension -- Brandon Sanderson.jpg",
  "The Westing Game -- Ellen Raskin.jpg",
  "The Wild Robot -- Peter Brown.jpg",
  "The Wild Robot Escapes -- Peter Brown.jpg",
  "The Wild Robot Protects -- Peter Brown.jpg",
  "The Wise Man's Fear Kingkiller Chronicles -- Patrick Rothfuss.jpg",
  "The World According To Physics -- Jim Al-Khalili.jpg",
  "The Wright Brothers -- David McCullough.jpg",
  "Theft of Swords Riyria Revelations, Volume 1 -- Michael J. Sullivan.jpg",
  "There is no Antimemetics Division -- Sam Hughes.jpg",
  "Think Faster, Talk Smarter -- Matt Abrahams.jpg",
  "Thinking Fast and Slow -- Daniel Kahneman.jpg",
  "Thinking in Systems A Primer -- Donella Meadows.jpg",
  "This Again -- Adam Borba.jpg",
  "This is How You Lose The Time War -- Amal El-Mohtar.jpg",
  "Tiamat's Wrath -- James Corey.jpg",
  "Timeline -- Michael Crichton.jpg",
  "To Pixar and Beyond -- Lawrence Levy.jpg",
  "Tress of the Emerald Sea -- Brandon Sanderson.jpg",
  "Trillion Dollar Coach -- Eric Schmidt.jpg",
  "Tripwire -- Lee Child.jpg",
  "True Believer -- Jack Carr.jpg",
  "Twelve Against the Gods -- William Bolitho.jpg",
  "Unforgettable -- Eric James Stone.jpg",
  "Unoffendable -- Brant Hansen.jpg",
  "Uprooting Anger -- Robert D. Jones.jpg",
  "Walt Disney -- Neal Gabler.jpg",
  "Warbreaker -- Brandon Sanderson.jpg",
  "We Are Legion (We Are Bob) Bobiverse, Book 1 -- Dennis E. Taylor.jpg",
  "What If -- Randall Munroe.jpg",
  "What Successful People Do Before Breakfast -- Laura Vanderkam.jpg",
  "When -- Daniel H. Pink.jpg",
  "When the Heavens Went on Sale -- Ashlee Vance.jpg",
  "Why Fish Don't Exist -- Lulu Miller.jpg",
  "Why We Sleep -- Matthew Walker.jpg",
  "Wild Things The Art of Nurturing Boys -- Stephen James.jpg",
  "Wild at Heart Discovering the Secret of a Man's Soul -- John Eldredge.jpg",
  "Wind and Truth -- Brandon Sanderson.jpg",
  "Wizard The Life and Times of Nikola Tesla Biography of a Genius -- Marc J. Seifer.jpg",
  "Wool -- Hugh Howey.jpg",
  "Words of Radiance -- Brandon Sanderson.jpg",
  "Work Rules! -- Laszlo Bock.jpg",
  "World War 2 in the Pacific -- Joe Giorello.jpg",
  "Yes Please -- Amy Poehler.jpg",
  "Yes, And -- Kelly Leonard.jpg",
  "You Can Be a Stock Market Genius -- Joel Greenblatt.jpg",
  "Yumi and the Nightmare Painter -- Brandon Sanderson.jpg",
  "Zero Day -- David Baldacci.jpg",
  "Zero to One Notes on Startups, or How to Build the Future -- Peter Thiel.jpg",
  "iWoz -- Steve Wozniak.jpg"
];

// Jacket filenames keep at most this many characters of the title.
var TITLE_LIMIT = 70;

var coverLookup = null;

function field(row, name) {
  if (!row || typeof row !== "object") return "";
  if (Object.prototype.hasOwnProperty.call(row, name) && row[name] != null) {
    return String(row[name]);
  }
  var wanted = name.toLowerCase();
  var keys = Object.keys(row);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].trim().toLowerCase() === wanted && row[keys[i]] != null) {
      return String(row[keys[i]]);
    }
  }
  return "";
}

function expandYear(year) {
  if (year >= 1900 && year <= 2100) return year;
  if (year >= 0 && year < 100) return year >= 70 ? 1900 + year : 2000 + year;
  return null;
}

function utcDay(year, month, day) {
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  var time = Date.UTC(year, month - 1, day);
  var date = new Date(time);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return time;
}

function parseReadDate(raw) {
  var value = String(raw || "").trim();
  var match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) return utcDay(expandYear(Number(match[3])), Number(match[1]), Number(match[2]));
  match = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (match) return utcDay(expandYear(Number(match[2])), Number(match[1]), 1);
  match = value.match(/^(\d{4})$/);
  if (match) return utcDay(expandYear(Number(match[1])), 1, 1);
  return null;
}

function booksFromRows(rows) {
  var books = [];
  (rows || []).forEach(function (row, index) {
    var title = field(row, "title").trim();
    if (!title) return;
    var author = field(row, "author").trim();
    books.push({
      title: title,
      displayTitle: displayTitleFor(title, author),
      author: author,
      readAt: parseReadDate(field(row, "date read")),
      order: index
    });
  });
  return orderNewestFirst(books);
}

function orderNewestFirst(books) {
  var anchor = null;
  var leading = [];
  books.forEach(function (book) {
    if (book.readAt != null) {
      if (leading.length) {
        leading.forEach(function (item, index) {
          item.sortAt = book.readAt + (leading.length - index);
        });
        leading = [];
      }
      book.sortAt = book.readAt;
      anchor = book.readAt;
    } else if (anchor == null) {
      leading.push(book);
    } else {
      anchor -= 1;
      book.sortAt = anchor;
    }
  });
  if (leading.length) {
    leading.forEach(function (item, index) {
      item.sortAt = leading.length - index;
    });
  }
  return books.slice().sort(function (a, b) {
    return b.sortAt - a.sortAt || a.order - b.order;
  });
}

function swatchFor(title) {
  var hash = 0;
  for (var i = 0; i < title.length; i++) hash = (hash + title.charCodeAt(i) * (i + 1)) % SWATCHES.length;
  return SWATCHES[hash];
}

function monogram(title) {
  var match = title.match(/[A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : "·";
}

function normalizeAuthor(author) {
  var trimmed = author.trim().replace(/\s+/g, " ");
  var inverted = trimmed.match(/^([A-Za-z][A-Za-z.'’-]*),\s*([A-Za-z].+)$/);
  if (!inverted) return trimmed;
  return (inverted[2].trim() + " " + inverted[1].trim()).trim();
}

function normalizeKey(value) {
  return String(value || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/:/g, " ")
    .replace(/\?/g, "")
    .replace(/(\d+)\s+1\/2\b/g, "$1.5")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function bookKey(title, author) {
  return normalizeKey(title) + "|" + normalizeKey(normalizeAuthor(author));
}

function displayTitleFor(title, author) {
  return DISPLAY_TITLES[bookKey(title, author)] || title;
}

// Primary author, then co-author spellings jackets actually use:
// "First Last, Coauthor", "First Last and Other Last", "Chip and Joanna Gaines".
function authorKeysForLookup(author) {
  var trimmed = String(author || "").trim().replace(/\s+/g, " ");
  var keys = [];
  function add(value) {
    var key = normalizeKey(value);
    if (!key || keys.indexOf(key) !== -1) return;
    keys.push(key);
  }
  add(normalizeAuthor(trimmed));
  var comma = trimmed.indexOf(",");
  if (comma > 0 && /\s/.test(trimmed.slice(0, comma))) add(trimmed.slice(0, comma));
  var andParts = trimmed.split(/\s+and\s+/i);
  if (andParts.length === 2) {
    var left = andParts[0].trim();
    var right = andParts[1].trim();
    var leftWords = left.split(/\s+/);
    var rightWords = right.split(/\s+/);
    if (leftWords.length >= 2) add(left);
    if (leftWords.length === 1 && rightWords.length >= 2) {
      add(leftWords[0] + " " + rightWords[rightWords.length - 1]);
    }
  }
  return keys;
}

function coverIndex() {
  if (coverLookup) return coverLookup;
  var byKey = new Map();
  var byAuthor = new Map();
  COVER_FILES.forEach(function (filename) {
    if (IGNORED_COVERS[filename]) return;
    var base = filename.replace(/\.jpe?g$/i, "");
    var sep = base.lastIndexOf(" -- ");
    if (sep <= 0) return;
    var titleKey = normalizeKey(base.slice(0, sep));
    var authorKey = normalizeKey(base.slice(sep + 4));
    var key = titleKey + "|" + authorKey;
    if (!byKey.has(key)) byKey.set(key, filename);
    if (!byAuthor.has(authorKey)) byAuthor.set(authorKey, []);
    byAuthor.get(authorKey).push({ titleKey: titleKey, filename: filename });
  });
  coverLookup = { byKey: byKey, byAuthor: byAuthor };
  return coverLookup;
}

function coverFilenameFor(title, author) {
  var titleKey = normalizeKey(title);
  var authors = authorKeysForLookup(author);
  var aliasKey = titleKey + "|" + (authors[0] || "");
  if (Object.prototype.hasOwnProperty.call(COVER_ALIASES, aliasKey)) return COVER_ALIASES[aliasKey];
  var index = coverIndex();
  var i;
  for (i = 0; i < authors.length; i++) {
    var exact = index.byKey.get(titleKey + "|" + authors[i]);
    if (exact) return exact;
  }
  // Filenames slice the title at TITLE_LIMIT, then drop a trailing space.
  var cut = titleKey.slice(0, TITLE_LIMIT).replace(/\s+$/g, "");
  if (cut && cut !== titleKey && cut.length >= TITLE_LIMIT - 1) {
    for (i = 0; i < authors.length; i++) {
      var list = index.byAuthor.get(authors[i]) || [];
      for (var j = 0; j < list.length; j++) {
        if (list[j].titleKey === cut) return list[j].filename;
      }
    }
  }
  return null;
}

function coverUrl(filename) {
  return "covers/" + encodeURIComponent(filename);
}

function acceptCover(image, frame, attempt) {
  if (!image.isConnected) return;
  if (image.naturalWidth > 1 && image.naturalHeight > 1) {
    frame.classList.add("has-cover");
    return;
  }
  if (attempt < 2) {
    var retry = function () {
      acceptCover(image, frame, attempt + 1);
    };
    if (attempt === 0 && typeof image.decode === "function") {
      image.decode().then(retry).catch(function () {
        requestAnimationFrame(retry);
      });
      return;
    }
    requestAnimationFrame(retry);
    return;
  }
  image.remove();
}

function mountCover(frame, filename) {
  var image = document.createElement("img");
  image.className = "cover";
  image.alt = "";
  image.decoding = "async";
  // The card observer already defers work. Eager avoids Safari skipping
  // opacity:0 images that are also loading="lazy".
  image.loading = "eager";
  image.addEventListener("load", function () {
    acceptCover(image, frame, 0);
  });
  image.addEventListener("error", function () {
    image.remove();
  });
  frame.insertBefore(image, frame.firstChild);
  image.src = coverUrl(filename);
}

function buildCard(book) {
  var card = document.createElement("article");
  card.className = "card";
  card.dataset.title = book.title;
  card.dataset.author = book.author;

  var frame = document.createElement("div");
  frame.className = "cover-frame";
  frame.style.setProperty("--swatch", swatchFor(book.displayTitle || book.title));

  var placeholder = document.createElement("div");
  placeholder.className = "placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  var letter = document.createElement("span");
  letter.textContent = monogram(book.displayTitle || book.title);
  placeholder.appendChild(letter);
  frame.appendChild(placeholder);

  var meta = document.createElement("div");
  meta.className = "meta";
  var title = document.createElement("h2");
  title.className = "title";
  title.textContent = book.displayTitle || book.title;
  var author = document.createElement("p");
  author.className = "author";
  author.textContent = book.author;
  meta.appendChild(title);
  meta.appendChild(author);

  card.appendChild(frame);
  card.appendChild(meta);
  return card;
}

function renderBooks(grid, books) {
  function loadCard(card) {
    var frame = card.querySelector(".cover-frame");
    if (!frame || frame.querySelector(".cover")) return;
    var filename = coverFilenameFor(card.dataset.title || "", card.dataset.author || "");
    if (!filename) return;
    mountCover(frame, filename);
  }

  var observer = typeof IntersectionObserver === "function"
    ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        loadCard(entry.target);
      });
    }, { rootMargin: "480px 0px", threshold: 0.01 })
    : null;

  var fragment = document.createDocumentFragment();
  books.forEach(function (book) {
    fragment.appendChild(buildCard(book));
  });
  grid.appendChild(fragment);
  grid.querySelectorAll(".card").forEach(function (card) {
    if (observer) observer.observe(card);
    else loadCard(card);
  });
}

function boot() {
  var status = document.getElementById("status");
  var grid = document.getElementById("grid");
  if (!status || !grid) return;

  if (typeof Papa === "undefined") {
    status.textContent = "The list couldn’t be loaded.";
    return;
  }

  status.textContent = "Loading…";
  Papa.parse(SHEET_URL, {
    download: true,
    header: true,
    skipEmptyLines: "greedy",
    complete: function (results) {
      var books = booksFromRows(results && results.data);
      if (!books.length) {
        status.textContent = "Nothing on the list yet.";
        return;
      }
      status.hidden = true;
      grid.hidden = false;
      renderBooks(grid, books);
    },
    error: function () {
      status.textContent = "The list couldn’t be loaded.";
    }
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseReadDate: parseReadDate,
    booksFromRows: booksFromRows,
    normalizeAuthor: normalizeAuthor,
    displayTitleFor: displayTitleFor,
    coverFilenameFor: coverFilenameFor,
    coverUrl: coverUrl
  };
}
