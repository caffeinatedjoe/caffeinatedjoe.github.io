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

function normalizeKind(raw) {
  var value = String(raw || "").trim().toUpperCase();
  if (value === "F" || value === "FICTION") return "F";
  if (value === "N" || value === "NF" || value === "NONFICTION" || value === "NON-FICTION") return "N";
  return "";
}

// header:false rows, so the blank column after Length (F/N) is not dropped.
function sheetRows(data) {
  if (!data || !data.length || !Array.isArray(data[0])) return data || [];
  var header = data[0];
  var lengthIdx = -1;
  var c;
  for (c = 0; c < header.length; c++) {
    if (String(header[c] || "").trim().toLowerCase() === "length") lengthIdx = c;
  }
  var kindIdx = lengthIdx >= 0 ? lengthIdx + 1 : -1;
  var rows = [];
  for (var r = 1; r < data.length; r++) {
    var cells = data[r] || [];
    var obj = {};
    for (c = 0; c < header.length; c++) {
      var name = String(header[c] || "").trim();
      if (!name) continue;
      obj[name] = cells[c] != null ? String(cells[c]) : "";
    }
    if (kindIdx >= 0 && kindIdx < cells.length && cells[kindIdx] != null) {
      obj.kind = String(cells[kindIdx]);
    }
    rows.push(obj);
  }
  return rows;
}

function booksFromRows(rows) {
  var books = [];
  (rows || []).forEach(function (row, index) {
    var title = field(row, "title").trim();
    if (!title) return;
    var author = field(row, "author").trim();
    var dateRead = field(row, "date read").trim();
    books.push({
      title: title,
      displayTitle: displayTitleFor(title, author),
      author: author,
      dateRead: dateRead,
      readAt: parseReadDate(dateRead),
      length: field(row, "length").trim(),
      kind: normalizeKind(field(row, "kind") || field(row, "col_1")),
      order: index
    });
  });
  return orderNewestFirst(books);
}

function preferShelfSpot(found, book) {
  if (book.readAt != null && (found.readAt == null || book.readAt > found.readAt)) {
    found.readAt = book.readAt;
    found.dateRead = book.dateRead;
    found.sortAt = book.readAt;
    found.order = book.order;
    return;
  }
  if (found.readAt == null && (found.sortAt == null || book.sortAt > found.sortAt)) {
    found.sortAt = book.sortAt;
    found.order = book.order;
  }
}

// One physical book per title + author. The newest real read date keeps the shelf spot.
function groupReads(books) {
  var grouped = [];
  var byKey = new Map();
  (books || []).forEach(function (book) {
    var key = bookKey(book.title, book.author);
    var found = byKey.get(key);
    if (!found) {
      found = {
        title: book.title,
        displayTitle: book.displayTitle,
        author: book.author,
        dateRead: book.dateRead,
        readAt: book.readAt,
        length: book.length || "",
        kind: book.kind || "",
        sortAt: book.sortAt,
        order: book.order,
        reads: []
      };
      byKey.set(key, found);
      grouped.push(found);
    } else {
      if (!found.length && book.length) found.length = book.length;
      if (!found.kind && book.kind) found.kind = book.kind;
      preferShelfSpot(found, book);
    }
    if (book.dateRead) found.reads.push({ dateRead: book.dateRead, readAt: book.readAt });
  });
  grouped.forEach(function (book) {
    book.reads.sort(function (a, b) {
      if (a.readAt == null && b.readAt == null) return 0;
      if (a.readAt == null) return 1;
      if (b.readAt == null) return -1;
      return a.readAt - b.readAt;
    });
  });
  grouped.sort(function (a, b) {
    var aKey = a.readAt == null ? a.sortAt : a.readAt;
    var bKey = b.readAt == null ? b.sortAt : b.readAt;
    return bKey - aKey || a.order - b.order;
  });
  return grouped;
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

var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function readLabel(raw) {
  if (parseReadDate(raw) == null) return "";
  var value = String(raw || "").trim();
  var match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    var month = Number(match[1]);
    var day = Number(match[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return MONTHS[month - 1] + " " + day;
    return "";
  }
  match = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (match) {
    var onlyMonth = Number(match[1]);
    if (onlyMonth >= 1 && onlyMonth <= 12) return MONTHS[onlyMonth - 1];
  }
  return "";
}

function bookCountLabel(count) {
  return count === 1 ? "1 book" : count + " books";
}

function groupShelves(books) {
  var shelves = [];
  var byYear = new Map();
  var undated = [];
  (books || []).forEach(function (book) {
    var year = book.readAt == null ? null : new Date(book.readAt).getUTCFullYear();
    if (year == null) {
      undated.push(book);
      return;
    }
    var shelf = byYear.get(year);
    if (!shelf) {
      shelf = { key: String(year), year: year, books: [] };
      byYear.set(year, shelf);
      shelves.push(shelf);
    }
    shelf.books.push(book);
  });
  shelves.sort(function (a, b) { return b.year - a.year; });
  if (undated.length) shelves.push({ key: "undated", year: null, books: undated });
  return shelves;
}

function shelfHeading(shelf, index, shelfCount) {
  if (shelf.year != null) return String(shelf.year);
  if (index === 0 && shelfCount > 1) return "";
  return "Undated";
}

var MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatReadDate(raw) {
  var value = String(raw || "").trim();
  if (!value) return "";
  var match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    var month = Number(match[1]);
    var day = Number(match[2]);
    var year = expandYear(Number(match[3]));
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year) {
      return MONTHS_LONG[month - 1] + " " + day + ", " + year;
    }
  }
  match = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (match) {
    var onlyMonth = Number(match[1]);
    var onlyYear = expandYear(Number(match[2]));
    if (onlyMonth >= 1 && onlyMonth <= 12 && onlyYear) return MONTHS_LONG[onlyMonth - 1] + " " + onlyYear;
  }
  match = value.match(/^(\d{4})$/);
  if (match) {
    var only = expandYear(Number(match[1]));
    if (only) return String(only);
  }
  return value;
}

function formatLength(raw) {
  var value = String(raw || "").trim();
  if (!value) return "";
  var match = value.match(/^(\d+):(\d{2})$/);
  if (!match) return value;
  var hours = String(Number(match[1]));
  if (match[2] === "00") return hours + "h";
  return hours + "h " + match[2] + "m";
}

function kindLabel(kind) {
  if (kind === "F") return "Fiction";
  if (kind === "N") return "Nonfiction";
  return "";
}

var FICTION_SPINES = ["#6e3a34", "#7a4038", "#5e342e", "#64323a"];
var NONFICTION_SPINES = ["#3a4a3e", "#3e4c46", "#445248", "#364840"];
var PLAIN_SPINES = ["#5c4030", "#4e3828", "#684432", "#53392c"];

function tiltFor(title) {
  var hash = 0;
  var i;
  for (i = 0; i < title.length; i++) hash = (hash * 33 + title.charCodeAt(i)) >>> 0;
  var lean = ((hash % 90) / 10) - 4.5;
  if (Math.abs(lean) < 0.8) lean = lean < 0 ? -1.8 : 1.7;
  return {
    lean: lean.toFixed(2) + "deg",
    yaw: (12 + (hash % 7)) + "deg",
    spine: null,
    hash: hash
  };
}

function spineFor(title, kind) {
  var tilt = tiltFor(title);
  var palette = kind === "F" ? FICTION_SPINES : kind === "N" ? NONFICTION_SPINES : PLAIN_SPINES;
  return palette[tilt.hash % palette.length];
}

var PULL_MS = 860;
var PULL_EASE = "linear";

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shelfCoverPose(book) {
  var frame = book.querySelector(".cover-frame");
  if (!frame) return null;
  var rect = frame.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    lean: "0deg",
    yaw: "0deg"
  };
}

function jacketSize(naturalWidth, naturalHeight) {
  var width = naturalWidth;
  var height = naturalHeight;
  if (!(width > 1) || !(height > 1)) return null;
  var viewportW = window.innerWidth || 360;
  var viewportH = window.innerHeight || 640;
  var wide = viewportW >= 720;
  var cardInner = Math.max(140, Math.min(wide ? 736 : 352, viewportW - 28) - (wide ? 48 : 36));
  var maxW = Math.min(wide ? 300 : 240, viewportW * (wide ? 0.34 : 0.68), wide ? 300 : cardInner);
  var maxH = Math.min(wide ? viewportH * 0.68 : viewportH * 0.42, wide ? 540 : 420);
  var ratio = width / height;
  var boxW = maxW;
  var boxH = boxW / ratio;
  if (boxH > maxH) {
    boxH = maxH;
    boxW = boxH * ratio;
  }
  return {
    width: Math.max(1, Math.round(boxW)),
    height: Math.max(1, Math.round(boxH))
  };
}

function elementPose(el) {
  if (!el) return null;
  var rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    lean: "0deg",
    yaw: "0deg"
  };
}

function poseTransform(pose) {
  return "perspective(720px) rotateY(" + pose.yaw + ") rotate(" + pose.lean + ")";
}

function applyPose(el, pose) {
  el.style.left = pose.left + "px";
  el.style.top = pose.top + "px";
  el.style.width = Math.max(1, pose.width) + "px";
  el.style.height = Math.max(1, pose.height) + "px";
  el.style.transform = poseTransform(pose);
}

// The shelf face crops the jacket. The flyer keeps object-fit: cover while its
// box animates from that crop to the jacket's natural aspect, so the full
// cover is revealed by the time it lands.
function flyCover(src, from, to, done) {
  if (!src || !from || !to || prefersReducedMotion() || typeof Element.prototype.animate !== "function") {
    if (done) done();
    return null;
  }
  var flyer = document.createElement("img");
  flyer.className = "cover-flyer";
  flyer.alt = "";
  flyer.src = src;
  applyPose(flyer, from);
  document.body.appendChild(flyer);
  function mix(a, b, t) { return a + (b - a) * t; }
  function frame(t, travel, liftPx) {
    return {
      offset: t,
      left: mix(from.left, to.left, travel) + "px",
      top: Math.max(8, mix(from.top, to.top, travel) - liftPx) + "px",
      width: Math.max(1, mix(from.width, to.width, travel)) + "px",
      height: Math.max(1, mix(from.height, to.height, travel)) + "px",
      transform: poseTransform(travel < 0.2 ? from : to),
      boxShadow: travel < 0.5
        ? "0 12px 18px rgba(0, 0, 0, 0.34)"
        : "0 26px 40px rgba(0, 0, 0, 0.46)",
      borderRadius: travel > 0.65 ? "3px 8px 8px 3px" : "2px"
    };
  }
  var lift = Math.min(28, Math.abs(to.top - from.top) * 0.1 + 12);
  var anim = flyer.animate([
    frame(0, 0, 0),
    frame(0.18, 0.12, lift * 0.35),
    frame(0.42, 0.46, lift),
    frame(0.7, 0.78, lift * 0.45),
    frame(1, 1, 0)
  ], { duration: PULL_MS, easing: PULL_EASE, fill: "both" });
  var handle = { flyer: flyer, anim: anim, cancelled: false };
  anim.onfinish = function () {
    if (handle.cancelled) return;
    flyer.remove();
    if (done) done();
  };
  return handle;
}

function buildBook(book, index) {
  var card = document.createElement("article");
  card.className = "book";
  card.dataset.title = book.title;
  card.dataset.author = book.author;
  if (book.kind) card.dataset.kind = book.kind;
  var name = book.displayTitle || book.title;
  var tilt = tiltFor(name);
  card.style.setProperty("--lean", tilt.lean);
  card.style.setProperty("--yaw", tilt.yaw);
  card.style.setProperty("--swatch", swatchFor(name));
  card.style.setProperty("--spine", spineFor(name, book.kind));
  if (book.kind === "F") card.style.setProperty("--thread", "#d15a4e");
  if (book.kind === "N") card.style.setProperty("--thread", "#8eae98");

  var pull = document.createElement("div");
  pull.className = "pull";

  var hit = document.createElement("button");
  hit.type = "button";
  hit.className = "book-hit";
  hit.setAttribute("aria-expanded", "false");
  hit.setAttribute("aria-controls", "detail-" + index);

  var volume = document.createElement("span");
  volume.className = "volume";

  var spine = document.createElement("span");
  spine.className = "spine";
  spine.setAttribute("aria-hidden", "true");

  var frame = document.createElement("span");
  frame.className = "cover-frame";

  var placeholder = document.createElement("span");
  placeholder.className = "placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  var letter = document.createElement("span");
  letter.className = "mono";
  letter.textContent = monogram(name);
  placeholder.appendChild(letter);
  frame.appendChild(placeholder);

  var pages = document.createElement("span");
  pages.className = "pages";
  pages.setAttribute("aria-hidden", "true");

  volume.appendChild(spine);
  volume.appendChild(frame);
  volume.appendChild(pages);

  var accessible = document.createElement("span");
  accessible.className = "sr-only";
  accessible.textContent = name + (book.author ? ", " + book.author : "");

  hit.appendChild(volume);
  hit.appendChild(accessible);

  var detail = document.createElement("div");
  detail.className = "detail";
  detail.id = "detail-" + index;
  detail.hidden = true;
  detail.setAttribute("role", "dialog");
  detail.setAttribute("aria-modal", "true");
  detail.setAttribute("aria-label", name);
  detail.style.setProperty("--swatch", swatchFor(name));
  detail.style.setProperty("--spine", spineFor(name, book.kind));

  var close = document.createElement("button");
  close.type = "button";
  close.className = "detail-close";
  close.setAttribute("data-close-detail", "");
  close.setAttribute("aria-label", "Put the book back");
  close.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.2 4.2l7.6 7.6M11.8 4.2l-7.6 7.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';

  var jacket = document.createElement("div");
  jacket.className = "jacket";
  var jacketImg = document.createElement("img");
  jacketImg.className = "jacket-img";
  jacketImg.alt = "";
  jacketImg.hidden = true;
  var jacketPlate = document.createElement("div");
  jacketPlate.className = "jacket-plate";
  jacketPlate.setAttribute("aria-hidden", "true");
  var jacketLetter = document.createElement("span");
  jacketLetter.className = "mono";
  jacketLetter.textContent = monogram(name);
  jacketPlate.appendChild(jacketLetter);
  jacket.appendChild(jacketImg);
  jacket.appendChild(jacketPlate);

  var copy = document.createElement("div");
  copy.className = "detail-copy";

  var title = document.createElement("h3");
  title.className = "detail-title";
  title.textContent = name;
  var author = document.createElement("p");
  author.className = "detail-author";
  author.textContent = book.author;

  var facts = document.createElement("div");
  facts.className = "detail-facts";
  var length = document.createElement("p");
  length.className = "detail-length";
  var lengthK = document.createElement("span");
  lengthK.className = "detail-k";
  lengthK.textContent = "Length";
  var lengthV = document.createElement("span");
  lengthV.textContent = formatLength(book.length) || "not listed";
  length.appendChild(lengthK);
  length.appendChild(lengthV);
  facts.appendChild(length);
  var kind = kindLabel(book.kind);
  if (kind) {
    var stamp = document.createElement("p");
    stamp.className = "stamp";
    stamp.textContent = kind;
    facts.appendChild(stamp);
  }

  var readsWrap = document.createElement("div");
  readsWrap.className = "detail-reads";
  var readsK = document.createElement("p");
  readsK.className = "detail-k";
  readsK.textContent = "Read";
  readsWrap.appendChild(readsK);
  var reads = book.reads || [];
  if (!reads.length) {
    var empty = document.createElement("p");
    empty.className = "detail-empty";
    empty.textContent = "No date recorded";
    readsWrap.appendChild(empty);
  } else {
    var list = document.createElement("ul");
    list.className = "reads";
    reads.forEach(function (read) {
      var item = document.createElement("li");
      item.textContent = formatReadDate(read.dateRead);
      list.appendChild(item);
    });
    readsWrap.appendChild(list);
  }

  copy.appendChild(title);
  copy.appendChild(author);
  copy.appendChild(facts);
  copy.appendChild(readsWrap);
  var scroll = document.createElement("div");
  scroll.className = "detail-scroll";
  scroll.appendChild(jacket);
  scroll.appendChild(copy);
  detail.appendChild(close);
  detail.appendChild(scroll);
  detail.setAttribute("aria-labelledby", "detail-title-" + index);
  title.id = "detail-title-" + index;

  pull.appendChild(hit);
  pull.appendChild(detail);
  card.appendChild(pull);
  card._pull = pull;
  card._detail = detail;
  return card;
}

function renderBooks(root, books) {
  function loadCard(card) {
    var frame = card.querySelector(".cover-frame");
    if (!frame || frame.querySelector(".cover")) return;
    var filename = coverFilenameFor(card.dataset.title || "", card.dataset.author || "");
    if (!filename) return;
    mountCover(frame, filename);
  }

  var shelves = groupShelves(books);
  var seenIds = {};
  var fragment = document.createDocumentFragment();
  var cards = [];
  var enterIndex = 0;
  var bookIndex = 0;
  var open = null;
  var flight = null;
  var pullGen = 0;
  var dismissLock = false;
  var dismissTimer = 0;
  var scrim = document.getElementById("scrim");
  var layer = document.getElementById("pull-layer");

  function clearFlight() {
    if (!flight) return null;
    var rect = flight.flyer.getBoundingClientRect();
    flight.cancelled = true;
    if (flight.anim) flight.anim.cancel();
    flight.flyer.remove();
    flight = null;
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      lean: "0deg",
      yaw: "0deg"
    };
  }

  function settleDetail(book) {
    var detail = book._detail;
    if (!detail) return;
    detail.classList.remove("is-open");
    detail.hidden = true;
    var img = detail.querySelector(".jacket-img");
    var plate = detail.querySelector(".jacket-plate");
    if (img) img.classList.remove("is-flying");
    if (plate) plate.classList.remove("is-flying");
    if (book._pull && detail.parentNode !== book._pull) book._pull.appendChild(detail);
  }

  function showScrim(gen) {
    if (!scrim) return;
    scrim.hidden = false;
    scrim.classList.remove("is-shown");
    requestAnimationFrame(function () {
      if (gen === pullGen && scrim) scrim.classList.add("is-shown");
    });
  }

  function hideScrim() {
    if (!scrim) return;
    scrim.classList.remove("is-shown");
    scrim.hidden = true;
  }

  function whenCoverReady(book, cb) {
    loadCard(book);
    var img = book.querySelector(".cover");
    if (!img) {
      cb("");
      return;
    }
    if (img.complete) {
      cb(img.naturalWidth > 1 ? (img.getAttribute("src") || "") : "");
      return;
    }
    var done = function () {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      cb(img.naturalWidth > 1 ? (img.getAttribute("src") || "") : "");
    };
    img.addEventListener("load", done);
    img.addEventListener("error", done);
  }

  function shownJacket(detail, src) {
    var img = detail.querySelector(".jacket-img");
    var plate = detail.querySelector(".jacket-plate");
    if (src && img) {
      if (img.getAttribute("src") !== src) img.src = src;
      img.hidden = false;
      if (plate) plate.hidden = true;
      return img;
    }
    if (img) img.hidden = true;
    if (plate) plate.hidden = false;
    return plate;
  }

  function closeBook(immediate) {
    if (!open) return;
    var book = open;
    var detail = book._detail;
    var hit = book.querySelector(".book-hit");
    var bay = book.closest(".bay");
    pullGen += 1;
    var fromFlight = clearFlight();
    var stageOpen = !!(detail && detail.classList.contains("is-open") && !detail.hidden);
    var img = detail ? detail.querySelector(".jacket-img") : null;
    var plate = detail ? detail.querySelector(".jacket-plate") : null;
    var src = img && !img.hidden ? (img.getAttribute("src") || "") : "";
    var shown = src ? img : plate;

    function finish() {
      book.classList.remove("is-pulled", "is-away");
      if (hit) hit.setAttribute("aria-expanded", "false");
      if (bay) bay.classList.remove("has-pulled");
      settleDetail(book);
      if (layer) layer.hidden = true;
      hideScrim();
      document.body.classList.remove("is-detail-open");
      if (open === book) open = null;
    }

    var from = fromFlight || (stageOpen ? elementPose(shown) : null);
    var to = shelfCoverPose(book);
    if (!immediate && stageOpen && src && from && to) {
      if (shown) shown.classList.add("is-flying");
      if (scrim) scrim.classList.remove("is-shown");
      flight = flyCover(src, from, to, function () {
        flight = null;
        finish();
      });
      if (flight) return;
    }
    finish();
  }

  function presentBook(book, gen, src) {
    if (gen !== pullGen || open !== book) return;
    var detail = book._detail;
    if (!detail || !layer) return;
    var shown = shownJacket(detail, src);
    var from = shelfCoverPose(book);
    if (src && shown) {
      var shelfImg = book.querySelector(".cover");
      var sized = shelfImg ? jacketSize(shelfImg.naturalWidth, shelfImg.naturalHeight) : null;
      if (sized) {
        shown.style.width = sized.width + "px";
        shown.style.height = sized.height + "px";
        shown.style.maxWidth = "none";
        shown.style.maxHeight = "none";
      }
    }
    if (shown) shown.classList.add("is-flying");
    layer.hidden = false;
    layer.appendChild(detail);
    detail.hidden = false;
    detail.classList.add("is-open");
    book.classList.add("is-away");
    var closeBtn = detail.querySelector(".detail-close");
    if (closeBtn && typeof closeBtn.focus === "function") {
      closeBtn.focus({ preventScroll: true });
    }
    var to = src ? elementPose(shown) : null;
    if (!src || !from || !to) {
      if (shown) shown.classList.remove("is-flying");
      return;
    }
    flight = flyCover(src, from, to, function () {
      flight = null;
      if (gen !== pullGen) return;
      if (shown) shown.classList.remove("is-flying");
    });
    if (!flight && shown) shown.classList.remove("is-flying");
  }

  function openBook(book) {
    if (open || dismissLock) return;
    pullGen += 1;
    var gen = pullGen;
    var hit = book.querySelector(".book-hit");
    book.classList.add("is-pulled");
    if (hit) hit.setAttribute("aria-expanded", "true");
    var bay = book.closest(".bay");
    if (bay) bay.classList.add("has-pulled");
    document.body.classList.add("is-detail-open");
    if (layer) layer.hidden = false;
    showScrim(gen);
    open = book;
    whenCoverReady(book, function (src) {
      presentBook(book, gen, src);
    });
  }

  function isCloseControl(target) {
    return !!(target && target.closest && target.closest("[data-close-detail]"));
  }

  function isInsideOpenDetail(target) {
    return !!(open && open._detail && target && open._detail.contains(target) && !isCloseControl(target));
  }

  function armDismiss() {
    dismissLock = true;
    window.clearTimeout(dismissTimer);
    dismissTimer = window.setTimeout(function () {
      dismissLock = false;
    }, 500);
  }

  function dismissOpen(event) {
    if (!open) return false;
    if (isInsideOpenDetail(event.target)) return false;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    if (!dismissLock) {
      armDismiss();
      closeBook(false);
    }
    return true;
  }

  shelves.forEach(function (shelf, shelfIndex) {
    var section = document.createElement("section");
    section.className = "bay";
    var label = shelfHeading(shelf, shelfIndex, shelves.length);

    if (label) {
      var base = "shelf-" + (shelf.year == null ? "undated" : shelf.year);
      if (seenIds[base]) {
        seenIds[base] += 1;
        base += "-" + seenIds[base];
      } else {
        seenIds[base] = 1;
      }
      var head = document.createElement("div");
      head.className = "year-plate";
      var heading = document.createElement("h2");
      heading.className = "year-label";
      heading.id = base;
      heading.textContent = label;
      var count = document.createElement("p");
      count.className = "year-count";
      count.textContent = bookCountLabel(shelf.books.length);
      head.appendChild(heading);
      head.appendChild(count);
      section.appendChild(head);
      section.setAttribute("aria-labelledby", base);
    } else {
      section.setAttribute("aria-label", "Books without a recorded date");
    }

    var caseEl = document.createElement("div");
    caseEl.className = "case";
    var grid = document.createElement("div");
    grid.className = "books";
    shelf.books.forEach(function (book) {
      var card = buildBook(book, bookIndex);
      bookIndex += 1;
      if (enterIndex < 8) {
        card.classList.add("enter");
        card.style.setProperty("--in-delay", (enterIndex * 45) + "ms");
        enterIndex += 1;
      }
      cards.push(card);
      grid.appendChild(card);
    });
    caseEl.appendChild(grid);
    section.appendChild(caseEl);
    fragment.appendChild(section);
  });

  root.appendChild(fragment);

  var observer = typeof IntersectionObserver === "function"
    ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        loadCard(entry.target);
      });
    }, { rootMargin: "640px 0px", threshold: 0.01 })
    : null;

  cards.forEach(function (card) {
    if (observer) observer.observe(card);
    else loadCard(card);
  });

  document.addEventListener("pointerdown", function (event) {
    if (!open || isInsideOpenDetail(event.target)) return;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
  }, { capture: true, passive: false });

  document.addEventListener("pointerup", function (event) {
    if (!open) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dismissOpen(event);
  }, true);

  document.addEventListener("click", function (event) {
    if (dismissLock) {
      dismissLock = false;
      window.clearTimeout(dismissTimer);
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (open) {
      dismissOpen(event);
      return;
    }
    var hit = event.target.closest && event.target.closest(".book-hit");
    if (!hit || !root.contains(hit)) return;
    var book = hit.closest(".book");
    if (!book) return;
    event.preventDefault();
    openBook(book);
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !open) return;
    var hit = open.querySelector(".book-hit");
    closeBook(false);
    if (hit) hit.focus();
  });

  window.addEventListener("resize", function () {
    if (!open || !open._detail) return;
    clearFlight();
    var img = open._detail.querySelector(".jacket-img");
    if (!img || img.hidden || img.naturalWidth <= 1) return;
    var sized = jacketSize(img.naturalWidth, img.naturalHeight);
    if (!sized) return;
    img.style.width = sized.width + "px";
    img.style.height = sized.height + "px";
    img.style.maxWidth = "none";
    img.style.maxHeight = "none";
    img.classList.remove("is-flying");
  });
}

function boot() {
  var status = document.getElementById("status");
  var shelves = document.getElementById("shelves");
  var count = document.getElementById("count");
  if (!status || !shelves) return;

  if (typeof Papa === "undefined") {
    status.textContent = "The list couldn’t be loaded.";
    return;
  }

  status.textContent = "Loading…";
  Papa.parse(SHEET_URL, {
    download: true,
    header: false,
    skipEmptyLines: "greedy",
    complete: function (results) {
      var books = groupReads(booksFromRows(sheetRows(results && results.data)));
      if (!books.length) {
        status.textContent = "Nothing on the list yet.";
        return;
      }
      status.hidden = true;
      shelves.hidden = false;
      if (count) {
        count.hidden = false;
        count.textContent = bookCountLabel(books.length);
      }
      renderBooks(shelves, books);
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
    coverUrl: coverUrl,
    readLabel: readLabel,
    groupShelves: groupShelves,
    shelfHeading: shelfHeading,
    bookCountLabel: bookCountLabel,
    sheetRows: sheetRows,
    groupReads: groupReads,
    formatLength: formatLength,
    formatReadDate: formatReadDate,
    normalizeKind: normalizeKind
  };
}
