function doGet(e) {
  var start_time = new Date();
  var err_msg = "Woah there little buddy!  You seem to be making some stuff up there.";  
  var properties = PropertiesService.getScriptProperties();
  var User = User_();
  var ui;

  if (properties == undefined) return ErrorUi_("Can't setup the PropertiesService");
  if (User == undefined) return ErrorUi_("Can't setup the User");
  
  try {

    if (e.parameter.application != undefined && e.parameter.application != "") {

      var Application = new Application_(e.parameter.application);
      if (e.parameter.cache != undefined && e.parameter.cache == "false") {
        Application.clearCache();
      }
      var can_edit = false;
      if (Application.getConfigurationValue("Edit Token") == Trim_(e.parameter.edit)) can_edit = true;
      User = User_(can_edit);

      if (User.isEditor && Application.getConfigurationValue("Edit Open") == "Yes") {
      
        ui = EditUi_(e, Application, properties, User);

      } else if (User.isCat && Application.getConfigurationValue("CATS Score Open") == "Yes") {
//      } else if (User.isCat) {
        
        ui = ScoreUi_(e, Application, properties, User);
        
      } else  {

        ui = ViewUi_(e, Application, properties, User);
        
      }

    } else if (e.parameter.dashboard != undefined) {

      ui = DashboardUi_(e, properties, User);
      
    } else if (e.parameter.scoreboard != undefined) {

      ui = ScoreboardUi_(e, properties, User);
      
    } else if (e.parameter.admin != undefined) {

      ui = AdminUi_(e, properties, User);
      
    } else {
      
      // default 
      if (properties.getProperty("accepting_applications") == "Yes") {

        ui = GetEmailUi_(e, properties);

      } else {

        ui = ErrorUi_("Sorry!  The application window for this grant round closed on " + FormatExactDate_(properties.getProperty("application_deadline_date")) + ".");

      }
          
    }

  } catch (err) {
    
    ui = ErrorUi_(err.toString());
  
  }

  var end_time = new Date();
  var duration = new Number((end_time.getTime() - start_time.getTime()) / 1000).toFixed(2);

  var user_name = User.Email;
  if (user_name == "") user_name = "Anonymous Viewer";
  if (User.isEditor) user_name = "Application Editor"; 
    
  ui.add(Label_(ui, "The Grant Robot created this page in " + duration + " seconds (Logged as " + user_name + ((User.isCat) ? " CATS" : "") + ((User.isIgnition) ? " IGNITION" : "") + ")", css.paragraph, css.indent, css.quote, css.shimbottom));
  
  return ui;
}

function doPost(e) {
  return FileUploaderHandler_(e);
}

function EditUi_(e, Application, properties, user) {
//  Application.clearCache();
  var sw = new Stopwatch_();
  
  var ui = Ui_(properties, "Apply for an Apogaea " + properties.getProperty("round_name") + " Grant");
  var app_id = Application.getId();
  var AutoSaveHandler = ui.createServerHandler("AutoSaveHandler_");
  var ErrorCheckHandler = ui.createServerHandler("ErrorCheckButtonClickHandler_");  
  var ScoreDb = Application.getScoresDb();
  var ScoreQuestions = [];
  var Robot = new Robot_();
  
  var appIdHidden = ui.createHidden("app_id", app_id);
  ui.add(appIdHidden);

  sw.lap("Header"); 
  
  var Content = Content_(ui);
  ui.add(Content);

  Content.add(Header_(ui, properties));

  Content.add(Section_(ui, "Instructions"));
  Content.add(Paragraph_(ui, 
                Panel_(ui)
                        .add(Label_(ui, 
                                    "Welcome to the Apogaea Grant Robot.   This page displays the most current information about your grant application.  " + 
                                    "Your information is automatically saved as you type.  Basic HTML markup such as bold, italic, etc. is allowed. " + 
                                    "Emails and URLs should be entered as plain text (e.g. http://example.com or studnutzz69@apogaea.com).  ",
                                    css.label, css.paragraph
                                   )
                        )
                        .add(Urlify_(ui, 
                                    "Anyone with the following URL to this page can edit your application.  " + 
                                     "Only share this link with people you trust: " + Application.getConfigurationValue("Edit Url"),
                                    css.label, css.paragraph, css.bold
                                   )
                        )
                        .add(Spacer_(ui))
                        .add(Spacer_(ui))
                        .add(Label_(ui, 
                                    "The application window for this round is open from " + FormatDate_(properties.getProperty("application_open_date")) + " until " + 
                                    FormatExactDate_(properties.getProperty("application_deadline_date")) + ".  " + "All applications must be complete and error-free by " + 
                                    FormatExactDate_(properties.getProperty("application_deadline_date")) + " - no exceptions.  " + 
                                    "Use the red \"SAVE AND CHECK FOR ERRORS\" button at the bottom of this page to check your application for errors.  " + 
                                    "All complete, error-free applications will be submitted automatically when the application window closes.  " + 
                                    "Incomplete applications and/or any applications with one or more errors after application window closes will be withdrawn from consideration.  ", 
                                    css.label, css.paragraph))
                        .add(Label_(ui, 
                                    "CATS will review your application from " + FormatDate_(properties.getProperty("cats_review_begin_date")) + " through " + FormatDate_(properties.getProperty("cats_review_end_date")) + ".  " + 
                                    "During this time, applicants will be notified by email if there are any questions or concerns about the project or application.   For the best chance at success, " + 
                                    "it is critical that you check your email during this time and respond to questions.  You will be given an opportunity to respond and/or modify " +
                                    "your application until " + FormatExactDate_(properties.getProperty("applications_final_date")) + ".  After that time, no further editing of your application is allowed.  ",
                                    css.label, css.paragraph
                                    )
                        )
                        .add(Label_(ui, 
                                     "Applicants will be notified of the CATS' decision by email on " + FormatDate_(properties.getProperty("applicants_notified_date")) + ".  " + 
                                     "If your project is selected to receive grant funding, you must read, sign, and return your grant agreement (the contract) by " + FormatExactDate_(properties.getProperty("contract_due_date")) + ".  ",
                                     css.label, css.paragraph
                                     )
                        )
                        .add(Label_(ui, 
                                     "IMPORTANT: We strongly recommend that you save a copy of your answers.  " +
                                     "Sometimes weird things happen and the Internet breaks.  We'd hate for you to lose all of " +
                                     "your hard work because there wasn't a backup of your answers.  Please, we're begging you, " +
                                     "save a copy of your answers.  Or, live on the edge and be prepared to accept any consequences!  :)", 
                                     css.errorlabel, css.bold
                                    )
                        )
                  )
              );
  
  var ContactInfoPanel = Section_(ui, "Contact Information");
  var ContactInfoContent = Panel_(ui, css.paragraph, css.indent);
  var LegalName = TextBox_(ui, "LegalName").setText(Application.getResponseValue("LegalName")).addValueChangeHandler(AutoSaveHandler);
  ContactInfoContent.add(Question_(ui, LegalName, "Legal name", "We need a legal name to put on the contract and the check if you're awarded a grant.  This is also the person who pays taxes on the grant if $600.00 or more."));
  var AlternateName = TextBox_(ui, "AlternateName").setText(Application.getResponseValue("AlternateName")).addValueChangeHandler(AutoSaveHandler);
  ContactInfoContent.add(Question_(ui, AlternateName, "Alternate name", "This is how we will refer to you in email and in public communications.  Sometimes people prefer to use a pseudonym for privacy.  If you prefer to be referred to by something other than your legal name, enter that here.  If you're comfortable using your legal name, enter your first name here."));
  var Phone = TextBox_(ui, "Phone").setText(Application.getResponseValue("Phone")).addValueChangeHandler(AutoSaveHandler);
  ContactInfoContent.add(Question_(ui, Phone, "Phone", "Use the format ###-###-####"));
  var Email = TextBox_(ui, "Email").setText(Application.getConfigurationValue("Email")).setEnabled(false).addValueChangeHandler(AutoSaveHandler);
  ContactInfoContent.add(Question_(ui, Email, "Email address", "This should be an address you check frequently.  Email is the primary form of communication used throughout the grant process."));
  var Address = TextBox_(ui, "Address", css.textbox, css.halfwidth).setText(Application.getResponseValue("Address")).addValueChangeHandler(AutoSaveHandler);
  ContactInfoContent.add(Question_(ui, Address, "Mailing address", "This is where we send the check if you are awarded a grant.  Example: 123 Main Street, Apt #69, Denver, CO 80203"));
  ContactInfoPanel.add(ContactInfoContent);
  LegalName.addValueChangeHandler(ui.createServerHandler("AlternateNameHandler_").addCallbackElement(LegalName).addCallbackElement(AlternateName));
  
  var ProjectInfoPanel = Section_(ui, "Project Information");
  var ProjectInfoContent = Panel_(ui, css.paragraph, css.indent);
  ProjectInfoPanel.add(ProjectInfoContent);

  var ProjectName = TextBox_(ui, "ProjectName", css.textbox, css.halfwidth).setText(Application.getResponseValue("ProjectName")).addValueChangeHandler(AutoSaveHandler);
  ProjectInfoContent.add(Question_(ui, ProjectName, "Project name", "This is the name we will use when referring to your project."));

  var SelectedCategory = Application.getResponseValue("Category");
  var category_array = Robot.getCategories();
  if (SelectedCategory == "") category_array.unshift([""]);
  var Category = Listbox_(ui, "Category", SelectedCategory, category_array);

  ProjectInfoContent.add(Question_(ui, Category, "Category", "Select the category that best describes your project."));
  Category.addChangeHandler(AutoSaveHandler);

  var SelectedRating = Application.getResponseValue("Rating");
  var ratings_array = Robot.getRatings();
  if (SelectedRating == "") ratings_array.unshift([""]);
  var Rating = Listbox_(ui, "Rating", SelectedRating, ratings_array);
  ProjectInfoContent.add(Question_(ui, Rating, "Rating", "If your project was a movie, how would it be rated?  Your answer might affect your placement if the project isn't appropriate for all ages."));
  Rating.addChangeHandler(AutoSaveHandler);
  
  var Promo = TextArea_(ui, "Promo").setText(Application.getResponseValue("Promo")).addValueChangeHandler(AutoSaveHandler);
  var PromoQuestion = Question_(ui, Promo, "Project Website", "List your project website or any other links to online information about your project.  Include links to your project website, pictures or prototypes, plans for your project, a Facebook page, Kickstarters or other fundraising page, etc. Having a web presence can be a great tool for recruiting volunteers and getting additional funding for your project.");
  ProjectInfoContent.add(PromoQuestion);
  var PromoSave = Button_(ui, "PromoSave", "Save", ui.createClientHandler().forEventSource().setVisible(false), css.buttonblue, css.buttonbluedisabled).setVisible(false);
//  Promo.addKeyPressHandler(ui.createClientHandler().forTargets(PromoSave).setVisible(true));
  PromoQuestion.add(PromoSave);

  var html_tmp = "";
  
  var Description = TextArea_(ui, "Description").setText(Application.getResponseValue("Description")).addValueChangeHandler(AutoSaveHandler);
  var DescriptionInfo = Panel_(ui);
//  DescriptionInfo.add(Label_(ui, 
//                              "This is your opportunity to tell us about your idea in general terms.  We have WAY more " + 
//                              "requests for money than we have money to give out.  Help us understand what sets your project " + 
//                              "apart from the other applications we receive.  "));
  var DescriptionSave = Button_(ui, "DescriptionSave", "Save", ui.createClientHandler().forEventSource().setVisible(false), css.buttonblue, css.buttonbluedisabled).setVisible(false);
//  Description.addKeyPressHandler(ui.createClientHandler().forTargets(DescriptionSave).setVisible(true));
  DescriptionInfo.add(DescriptionSave);
  DescriptionInfo.add(Spacer_(ui));
  DescriptionInfo.add(Label_(ui, "CATS will score your response above using the following criteria:", css.label, css.bold));

  ScoreQuestions = ScoreDb.clearFilters().addFilter({"Section":"Description"}).getData();
  html_tmp = "<ul>";
  for (var i = 0; i < ScoreQuestions.length; i++) {
    html_tmp += "<li><b>" + ScoreQuestions[i]["Description"] + "</b></li>";
  }
  html_tmp += "</ul>";
  DescriptionInfo.add(HTML_(ui, html_tmp)); 
  
  var DescriptionQuestion = Question_(ui, Description, "Describe your idea/project", "Be as concise as possible.  This is your opportunity to tell us about your idea in general terms.  We have WAY more " + 
                              "requests for money than we have money to give out.  Help us understand what sets your project " + 
                              "apart from the other applications we receive.");
//UiApp.createApplication().createClientHandler().forTargets(widgets)
//  var DescriptionSaveHandler = ui.createClientHandler().forEventSource().setVisible(false);
  

  DescriptionQuestion.add(DescriptionInfo);

  ProjectInfoContent.add(DescriptionQuestion);

  var HasSound = Application.getResponseValue("HasSound");
  var Sound = Listbox_(ui, "HasSound", HasSound, [["No"],["Yes"]]);
  var SoundQuestion = Question_(ui, Sound, "Does your project make sound?", "This includes amplified sound and/or anything that will be heard beyond the immediate vicinity of your project."); 
  ProjectInfoContent.add(SoundQuestion);
  var SoundInfo =  Panel_(ui).setId("SoundInfo").setVisible(false);
  SoundInfo.add(Spacer_(ui));
  SoundInfo.add(Urlify_(ui, 
                        "IMPORTANT: Your logistical and placement requirements should include a description " +
                        "of the sound and the " +
                        "hours during which you'll have sound.  All sound at Apogaea is subject to the event sound policy.  For " +
                        "current sound policy, email the Sound Lead at sound@apogaea.com for assistance.  All sound must be turned down or off at the request of the Sound " +
                        "Enforcement Lead or an Apogaea Board member.  Those found to be in " +
                        "violation will not be turned on again until the issue is remedied.", css.errorlabel, css.bold));
  SoundQuestion.add(SoundInfo);
  Sound.addChangeHandler(ui.createClientHandler().validateMatches(Sound, "Yes").forTargets(SoundInfo).setVisible(true));
  Sound.addChangeHandler(ui.createClientHandler().validateMatches(Sound, "No").forTargets(SoundInfo).setVisible(false));  
  if (HasSound == "Yes") {
    SoundInfo.setVisible(true);
  } else {
    SoundInfo.setVisible(false);
  }
  Sound.addChangeHandler(AutoSaveHandler);
  
  var Logistics = TextArea_(ui, "Logistics").setText(Application.getResponseValue("Logistics")).addValueChangeHandler(AutoSaveHandler);
  var LogisticsInfo = Panel_(ui);
//  LogisticsInfo.add(Label_(ui, "Bringing a project to an event like Apogaea can be difficult.  A great idea isn't worth much if you aren't able to get it installed before the event is over.  This is your opportunity to tell us how you plan on building, transporting, installing, and keeping your project operational at the event.  If your project has any unique requirements, like needing specific placement, heavy machinery, etc., let us know that too.  Visit https://lnt.org for more information about Leave No Trace."));
  var LogisticsSave = Button_(ui, "LogisticsSave", "Save", ui.createClientHandler().forEventSource().setVisible(false), css.buttonblue, css.buttonbluedisabled).setVisible(false);
//  Logistics.addKeyPressHandler(ui.createClientHandler().forTargets(LogisticsSave).setVisible(true));
  LogisticsInfo.add(LogisticsSave);
  LogisticsInfo.add(Spacer_(ui));
  LogisticsInfo.add(Label_(ui, "CATS will score your response above using the following criteria:", css.label, css.bold));
  html_tmp = "<ul>";
  ScoreQuestions = ScoreDb.clearFilters().addFilter({"Section":"Logistics"}).getData();
  for (var i = 0; i < ScoreQuestions.length; i++) {
    if (ScoreQuestions[i]["Section"] == "Logistics") html_tmp += "<li><b>" + ScoreQuestions[i]["Description"] + "</b></li>";
  }
  html_tmp += "</ul>";
  LogisticsInfo.add(HTML_(ui, html_tmp)); 
  var LogisticsQuestion = Question_(ui, Logistics, "Describe your project’s logistical and placement requirements", "Be as concise as possible.  Bringing a project to an event like Apogaea can be difficult.  A great idea isn't worth much if you aren't able to get it installed before the event is over.  This is your opportunity to tell us how you plan on building, transporting, installing, and keeping your project operational at the event.  If your project has any unique requirements, like needing specific placement, heavy machinery, etc., let us know that too.  Visit https://lnt.org for more information about Leave No Trace.").add(LogisticsInfo);
  ProjectInfoContent.add(LogisticsQuestion);
  
  var HasGenerator = Application.getResponseValue("HasGenerator");
  var Generator = Listbox_(ui, "HasGenerator", HasGenerator, [["No"],["Yes"]]);
  var GeneratorQuestion = Question_(ui, Generator, "Does your project use a generator?");
  ProjectInfoContent.add(GeneratorQuestion);
  
  var GeneratorInfo = Panel_(ui).setId("GeneratorInfo").setVisible(false);
  GeneratorInfo.add(Spacer_(ui));
  GeneratorInfo.add(Urlify_(ui, 
    "IMPORTANT: Your safety plan should have a " + 
    "description of your generator and how you plan on operating  " +
    "it safely.  If your project requires a generator, you must comply with  " +
    "fire and sound regulations regarding enclosed generators.    " +
    "Email firelead@apogaea.com and sound@apogaea.com for the most  " +
    "current information about fire and sound regulations when  " +
    "operating generators at Apogaea.  All generators must be turned off at the request of BAMF,  " +
    "a Ranger, or Apogaea Board member.  Those found to be in  " +
    "violation will not be turned on again until the issue is  " +
    "remedied.", css.errorlabel, css.bold));
  GeneratorQuestion.add(GeneratorInfo);
  Generator.addChangeHandler(ui.createClientHandler().validateMatches(Generator, "Yes").forTargets(GeneratorInfo).setVisible(true));
  Generator.addChangeHandler(ui.createClientHandler().validateMatches(Generator, "No").forTargets(GeneratorInfo).setVisible(false));  

  if (HasGenerator == "Yes") {
    GeneratorInfo.setVisible(true);
  } else {
    GeneratorInfo.setVisible(false);
  }
  Generator.addChangeHandler(AutoSaveHandler);

  var HasFire = Application.getResponseValue("HasFire");
  var Fire = Listbox_(ui, "HasFire", HasFire, [["No"],["Yes"]]);
  var FireQuestion = Question_(ui, Fire, "Does your project use fire or fuel?");
  ProjectInfoContent.add(FireQuestion);
  var FireInfo = Panel_(ui).setId("FireInfo").setVisible(false);
  FireInfo.add(Spacer_(ui));
  
  FireInfo.add(Urlify_(ui, 
                       "STAGE 1 FIRE BAN IN EFFECT: Due to the Park County permitting restrictions, the overall conditions at the land, and our evolving assessment of fire safety at the property, " + 
                       "Apogaea has voluntarily imposed a Stage 1 ban for this year's event.  This means no wood, charcoal, or ember producing fires. " + 
                       "Propane, poi and similar fire performance tools would still be allowed. Part of the reason for calling this ban now is Apogaea thinks there is a very significant chance that " + 
                       "Park County will call a ban on us anyway, so we might as well just start planning ahead NOW, instead of building a bunch of wood-fired art that can't be used.", css.errorlabellarge, css.bold)); 
  FireInfo.add(Spacer_(ui));
  FireInfo.add(Urlify_(ui, 
                       "IMPORTANT: Apogaea is held in an area that is prone to fire restrictions " +
                       "and fire bans.  If your project will be burned (Effigy or Temple), " +
                       "or uses fire effects (propane, etc), or requires fuel of any kind, your safety plan must " +
                       "include a detailed fuel and/or burn plan.  " +
                       "Email firelead@apogaea.com for complete fire art safety information.  All flame effects must be turned off at the request of BAMF, a " +
                       "Ranger, or Apogaea Board member.  Those found to be in violation " +
                       "will not be turned on again until the issue is remedied.", css.errorlabel, css.bold));
  FireInfo.add(Spacer_(ui));
  FireInfo.add(Urlify_(ui, "Any project with fire or flame effects should read the BAMF 2015 Fire Art Guidelines: http://goo.gl/jGaKiI", css.errorlabel, css.bold));
  FireInfo.add(Spacer_(ui));
  FireInfo.add(Urlify_(ui, "If selected to build the Effigy or Temple, you will work with BAMF to formulate burn plan using this template http://goo.gl/6wXKds", css.errorlabel, css.bold));
  
  FireQuestion.add(FireInfo);
  Fire.addChangeHandler(ui.createClientHandler().validateMatches(Fire, "Yes").forTargets(FireInfo).setVisible(true));
  Fire.addChangeHandler(ui.createClientHandler().validateMatches(Fire, "No").forTargets(FireInfo).setVisible(false));  
  if (HasFire == "Yes") {
    FireInfo.setVisible(true);
  } else {
    FireInfo.setVisible(false);
  }
  Fire.addChangeHandler(AutoSaveHandler);
  
  var Safety = TextArea_(ui, "Safety").setText(Application.getResponseValue("Safety")).addValueChangeHandler(AutoSaveHandler);
  var SafetyInfo = Panel_(ui);
//  SafetyInfo.add(Label_(ui, "Apogaea can not fund any project that, in the opinion of CATS or Apogaea Board of Directors, presents a safety risk to participants.  Safety is an important part of your application.  Apogaea will ultimately not fund anything that is deemed unsafe.  It is important to outline how your project will be safe by describing its construction and any relevant safety features."));
  var SafetySave = Button_(ui, "SafetySave", "Save", ui.createClientHandler().forEventSource().setVisible(false), css.buttonblue, css.buttonbluedisabled).setVisible(false);
//  Safety.addKeyPressHandler(ui.createClientHandler().forTargets(SafetySave).setVisible(true));
  SafetyInfo.add(SafetySave);
  SafetyInfo.add(Spacer_(ui));
  SafetyInfo.add(Label_(ui, "CATS will score your response above using the following criteria:", css.label, css.bold));
  html_tmp = "<ul>";
  
  ScoreQuestions = ScoreDb.clearFilters().addFilter({"Section":"Safety"}).getData();
  for (var i = 0; i < ScoreQuestions.length; i++) {
    if (ScoreQuestions[i]["Section"] == "Safety") html_tmp += "<li><b>" + ScoreQuestions[i]["Description"] + "</b></li>";
  }
  html_tmp += "</ul>";
  SafetyInfo.add(HTML_(ui, html_tmp)); 
  
  var SafetyQuestion = Question_(ui, Safety, "Describe your safety plan", "Be as concise as possible.  Apogaea can not fund any project that, in the opinion of CATS or Apogaea Board of Directors, presents a safety risk to participants.  Safety is an important part of your application.  Apogaea will ultimately not fund anything that is deemed unsafe.  It is important to outline how your project will be safe by describing its construction and any relevant safety features.").add(SafetyInfo);
  ProjectInfoContent.add(SafetyQuestion);

  var Team = TextArea_(ui, "Team").setText(Application.getResponseValue("Team")).addValueChangeHandler(AutoSaveHandler);
  var TeamInfo = Panel_(ui);
//  TeamInfo.add(Label_(ui, "We’d love to hear about other projects you’ve successfully completed or see pictures of past work.  Demonstrating that you can get your project installed and functional at the event is important to us."));
  var TeamSave = Button_(ui, "TeamSave", "Save", ui.createClientHandler().forEventSource().setVisible(false), css.buttonblue, css.buttonbluedisabled).setVisible(false);
//  Team.addKeyPressHandler(ui.createClientHandler().forTargets(TeamSave).setVisible(true));
  TeamInfo.add(TeamSave);
  TeamInfo.add(Spacer_(ui));
  TeamInfo.add(Label_(ui, "CATS will score your response above using the following criteria:", css.label, css.bold));
  html_tmp = "<ul>";
  ScoreQuestions = ScoreDb.clearFilters().addFilter({"Section":"Team"}).getData();
  for (var i = 0; i < ScoreQuestions.length; i++) {
    if (ScoreQuestions[i]["Section"] == "Team") html_tmp += "<li><b>" + ScoreQuestions[i]["Description"] + "</b></li>";
  }
  html_tmp += "</ul>";
  TeamInfo.add(HTML_(ui, html_tmp)); 
  var TeamQuestion = Question_(ui, Team, "Tell us about yourself and any other creative bad asses helping you with your idea/project", "Be as concise as possible.  We’d love to hear about other projects you’ve successfully completed or see pictures of past work.  Demonstrating that you can get your project installed and functional at the event is important to us.").add(TeamInfo);
  ProjectInfoContent.add(TeamQuestion);
  
  var OwnershipPanel = ui.createVerticalPanel().setId("OwnershipPanel").setVisible(true);
  var Ownership = TextArea_(ui, "Ownership").setText(Application.getResponseValue("Ownership")).addValueChangeHandler(AutoSaveHandler);
  var OwnershipQuestion = Question_(ui, Ownership, "Describe your thoughts regarding ownership of the Effigy/Temple", "If you are selected to build the Effigy or Temple, before the grant is awarded, you must negotiate ownership of the art with the Apogaea Board of Directors. This is generally only important if there is a burn ban and the art cannot be burned. In that case, someone has to take ownership of the art and remove it from the land, store it, and possibly bring it back the following year.");

  OwnershipPanel.add(OwnershipQuestion);
  ProjectInfoContent.add(OwnershipPanel);
  
  Category.addChangeHandler(ui.createClientHandler().validateMatches(Category, "Effigy").forTargets(OwnershipPanel).setVisible(true));
  Category.addChangeHandler(ui.createClientHandler().validateMatches(Category, "Temple").forTargets(OwnershipPanel).setVisible(true));
  Category.addChangeHandler(ui.createClientHandler().validateMatches(Category, "Stand-alone Installation").forTargets(OwnershipPanel).setVisible(false));
  Category.addChangeHandler(ui.createClientHandler().validateMatches(Category, "Theme/Sound Camp").forTargets(OwnershipPanel).setVisible(false));
  Category.addChangeHandler(ui.createClientHandler().validateMatches(Category, "Center Camp Installation").forTargets(OwnershipPanel).setVisible(false));
  Category.addChangeHandler(ui.createClientHandler().validateMatches(Category, "Center Camp Workshop").forTargets(OwnershipPanel).setVisible(false));
  Category.addChangeHandler(ui.createClientHandler().validateMatches(Category, "Performance Art").forTargets(OwnershipPanel).setVisible(false));
  Category.addChangeHandler(ui.createClientHandler().validateMatches(Category, "Art Car / Mutant Vehicle").forTargets(OwnershipPanel).setVisible(false));
  Category.addChangeHandler(ui.createClientHandler().validateMatches(Category, "Workshop").forTargets(OwnershipPanel).setVisible(false));
  if (SelectedCategory == "Effigy" || SelectedCategory == "Temple") OwnershipPanel.setVisible(true);
  else OwnershipPanel.setVisible(false);

  var BudgetSection = Section_(ui, "Project Costs / Value").setId("BudgetPanel");
  var BudgetContent = Panel_(ui);
  
  var ProjectCostError = ErrorLabel_(ui, "ProjectCostError", "").setVisible(false);
  var addl_income = Application.getResponseValue("AdditionalIncome");
  var AdditionalIncome = TextArea_(ui, "AdditionalIncome").setText(addl_income).addValueChangeHandler(AutoSaveHandler);
  var AdditionalIncomeQuestion = Question_(ui, AdditionalIncome, "Describe any additional funding sources for your project", 
                                      "If your requested grant amount is less than the total cost of your project, describe how you account for the difference (fundraising, out of pocket, etc.)");
  var AdditionalIncomeSave = Button_(ui, "AdditionalIncomeSave", "Save", ui.createClientHandler().forEventSource().setVisible(false), css.buttonblue, css.buttonbluedisabled).setVisible(false);
//  AdditionalIncome.addKeyPressHandler(ui.createClientHandler().forTargets(AdditionalIncomeSave).setVisible(true));
  AdditionalIncomeQuestion.add(AdditionalIncomeSave);

  var fund_plan = Application.getResponseValue("FundingPlan");
  var FundingPlan = TextArea_(ui, "FundingPlan").setText(fund_plan).addValueChangeHandler(AutoSaveHandler);
  var FundingPlanQuestion = Question_(ui, FundingPlan, "Describe any additional funding amounts/options we should consider", 
                                      "For example: \"For $500 I can bring X.  For $1000, I can bring X and Y.\"");
  var FundingPlanSave = Button_(ui, "FundingPlanSave", "Save", ui.createClientHandler().forEventSource().setVisible(false), css.buttonblue, css.buttonbluedisabled).setVisible(false);
//  FundingPlan.addKeyPressHandler(ui.createClientHandler().forTargets(FundingPlanSave).setVisible(true));
  FundingPlanQuestion.add(FundingPlanSave);

  var BudgetEntryPanel = Panel_(ui).setId("BudgetEntryPanel");
  var ValueSection = Section_(ui, "Financial Summary");
  var ValuePanel = Panel_(ui).setId("ValuePanel");

  BudgetContent.add(ProjectCostError);
  BudgetContent.add(BudgetEntryPanel);
  BudgetContent.add(AdditionalIncomeQuestion.setStyleAttributes({marginLeft:"20px"}));
  BudgetContent.add(FundingPlanQuestion.setStyleAttributes({marginLeft:"20px"}));
  
  var BudgetInfo = Panel_(ui);
//  BudgetInfo.add(Label_(ui, "It is important to know that the project has been thought through and that there should be few, if any, financial suprises."));
  BudgetInfo.add(Spacer_(ui));
  BudgetInfo.add(Label_(ui, "CATS will score your responses above using the following criteria:", css.label, css.bold));
  html_tmp = "<ul>";
  ScoreQuestions = ScoreDb.clearFilters().addFilter({"Section":"Budget"}).getData();
  for (var i = 0; i < ScoreQuestions.length; i++) {
    if (ScoreQuestions[i]["Section"] == "Budget") html_tmp += "<li><b>" + ScoreQuestions[i]["Description"] + "</b></li>";
  }
  html_tmp += "</ul>";
  BudgetInfo.add(HTML_(ui, html_tmp)); 
  BudgetContent.add(Paragraph_(ui, BudgetInfo));
  
  var QuestionHandler = ui.createServerHandler("QuestionSaveButtonClickHandler_");
  var QuestionsSection = Panel_(ui).setId("QuestionsSection").setVisible(false);
  QuestionHandler.addCallbackElement(QuestionsSection);

  var ErrorCheckSection = Section_(ui, "Check the application for errors");
  var ErrorCheckContent = Panel_(ui);
  var ErrorCheckButton = Button_(ui, "ErrorCheckButton", "Save and check for errors", ErrorCheckHandler, css.buttonred, css.buttonredhover).addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setText("Checking...").setStyleAttributes(css.buttonreddisabled));
  var ErrorCheckMsg = Panel_(ui, css.question, css.shimtop).setId("ErrorCheckMsg").setVisible(false);
  ErrorCheckContent.add(Label_(ui, "Once your application is error free, it will be viewable by CATS.  The earlier your application is error free, the more time CATS have to review and understand your application.  The application must be complete and error free before " + FormatExactDate_(properties.getProperty("application_deadline_date")) + " or it will be withdrawn from consideration.  Any time you edit your application, you should re-check the application for errors."));
  ErrorCheckContent.add(Spacer_(ui));
  ErrorCheckContent.add(Spacer_(ui));
  ErrorCheckContent.add(ErrorCheckButton);
  ErrorCheckContent.add(ErrorCheckMsg);
  ErrorCheckSection.add(Paragraph_(ui, ErrorCheckContent));

  ErrorCheckContent.add(Spacer_(ui));
  ErrorCheckContent.add(Spacer_(ui));
  ErrorCheckContent.add(Spacer_(ui));
  ErrorCheckContent.add(Label_(ui, "You may also view the application as CATS to see how your application will be viewed by the grant selection entity (CATS)."));
  ErrorCheckContent.add(Spacer_(ui));
  ErrorCheckContent.add(Spacer_(ui));
  ErrorCheckContent.add(AnchorButton_(ui, "FileView", "View as CATS", ApplicationUrl_(Application.getId(), properties)));
  ErrorCheckContent.add(Spacer_(ui));

  Content.add(ContactInfoPanel);
  Content.add(ProjectInfoPanel);
  Content.add(BudgetSection);
  Content.add(BudgetContent);
  Content.add(ValueSection);
  Content.add(ValuePanel);
  if (Application.getConfigurationValue("Edit Open") == "Yes") Content.add(ErrorCheckSection);
  Content.add(Panel_(ui).setId("FilesList"));
  Content.add(FileUploaderForm_(ui, Application).setId("FileUploader"));
  Content.add(QuestionsSection);
  Content.add(Footer_(ui, properties));

  sw.lap("Content"); 

  FileList_(ui, Application);
  sw.lap("FileList");

  Questions_(ui, Application, properties, user, {showAsk: false});
  sw.lap("Questions"); 

  UpdateBudgetDataGrid_(ui, Application);
  sw.lap("Budget Grid"); 

  AutoSaveHandler.addCallbackElement(appIdHidden);
  AutoSaveHandler.addCallbackElement(LegalName);
  AutoSaveHandler.addCallbackElement(AlternateName);
  AutoSaveHandler.addCallbackElement(Email);
  AutoSaveHandler.addCallbackElement(Phone);
  AutoSaveHandler.addCallbackElement(Address);
  AutoSaveHandler.addCallbackElement(ProjectName);
  AutoSaveHandler.addCallbackElement(Promo);
  AutoSaveHandler.addCallbackElement(Category);
  AutoSaveHandler.addCallbackElement(Rating);
  AutoSaveHandler.addCallbackElement(Description);
  AutoSaveHandler.addCallbackElement(Logistics);
  AutoSaveHandler.addCallbackElement(Team);
  AutoSaveHandler.addCallbackElement(Safety);
  AutoSaveHandler.addCallbackElement(Generator);
  AutoSaveHandler.addCallbackElement(Sound);
  AutoSaveHandler.addCallbackElement(Fire);
  AutoSaveHandler.addCallbackElement(AdditionalIncome);
  AutoSaveHandler.addCallbackElement(FundingPlan);
  AutoSaveHandler.addCallbackElement(Ownership);
  AutoSaveHandler.addCallbackElement(OwnershipPanel);

  ErrorCheckHandler.addCallbackElement(appIdHidden);
  ErrorCheckHandler.addCallbackElement(LegalName);
  ErrorCheckHandler.addCallbackElement(AlternateName);
  ErrorCheckHandler.addCallbackElement(Email);
  ErrorCheckHandler.addCallbackElement(Phone);
  ErrorCheckHandler.addCallbackElement(Address);
  ErrorCheckHandler.addCallbackElement(ProjectName);
  ErrorCheckHandler.addCallbackElement(Promo);
  ErrorCheckHandler.addCallbackElement(Category);
  ErrorCheckHandler.addCallbackElement(Rating);
  ErrorCheckHandler.addCallbackElement(Description);
  ErrorCheckHandler.addCallbackElement(Logistics);
  ErrorCheckHandler.addCallbackElement(Team);
  ErrorCheckHandler.addCallbackElement(Safety);
  ErrorCheckHandler.addCallbackElement(Generator);
  ErrorCheckHandler.addCallbackElement(Sound);
  ErrorCheckHandler.addCallbackElement(Fire);
  ErrorCheckHandler.addCallbackElement(Ownership);
  ErrorCheckHandler.addCallbackElement(AdditionalIncome);
  ErrorCheckHandler.addCallbackElement(FundingPlan);
  ErrorCheckHandler.addCallbackElement(ErrorCheckMsg);
  ErrorCheckHandler.addCallbackElement(ProjectCostError);
  
  if (properties.getProperty("log_views") == "Yes") {
        
    var log_email = user.Email; 
    if (log_email == "") log_email = "EDITOR";
    
    var new_date = new Date();

//    var update = {"Email":log_email,
//                  "Application ID":Application.getId(),
//                  "Date":new Date()};
    var update = {"Email":log_email,
                  "Application ID":Application.getId(),
                  "Date Time":Utilities.formatDate(new_date, Session.getScriptTimeZone(), "M/d/yyyy HH:mm:ss"),
                  "Date":Utilities.formatDate(new_date, Session.getScriptTimeZone(), "M/d/yyyy"),
                  "Unique Index":log_email+Application.getId()
                 };
    var view_log_sheet = new Sheet_(Robot.getRobot().getSheetByName("View Log"));
    view_log_sheet.insertRow(update);
  
  }
  
  return ui;
  
}

function UpdateBudgetDataGrid_(ui, Application, edit) {
  var sw = new Stopwatch_();

  if (edit == undefined) edit = true;
  var BudgetEntryPanel = ui.getElementById("BudgetEntryPanel");
  var BudgetDataGridLastRow = 1;
  var subtotal = 0;
  var total = 0;
  var grant_total = 0;
  var non_grant_total = 0;
  var budget_data = Application.getBudget();
  var app_id = Application.getId();
  var BudgetDataGrid = ui.createFlexTable().setId("BudgetDataGrid").setStyleAttributes({marginLeft:"20px"}).setStyleAttributes(css.budgetdatagrid).setBorderWidth(0).setCellSpacing(1).setCellPadding(3);

  sw.lap("BudgetGridSetup"); 
  
  BudgetEntryPanel.clear();
  
  BudgetDataGrid.setWidget(0, 0, Label_(ui, "Description", css.budgetdatagridheaderlabel).setWordWrap(true));
  BudgetDataGrid.setWidget(0, 1, Label_(ui, "Cost", css.budgetdatagridheaderlabel).setWordWrap(false));
  BudgetDataGrid.setWidget(0, 2, Label_(ui, "Source", css.budgetdatagridheaderlabel).setWordWrap(false));
  if (edit) BudgetDataGrid.setWidget(0, 3, Label_(ui, "Action", css.budgetdatagridheaderlabel).setWordWrap(false));
  BudgetDataGrid.setRowStyleAttributes(0, css.budgetdatagridheader);
  BudgetDataGrid.setColumnStyleAttributes(0, css.fullwidth);

  for (var i = 0; i < budget_data.length; i++) {
    
    var item_id = budget_data[i]["Budget ID"];
    var item_description = budget_data[i]["Description"];
    var item_cost = budget_data[i]["Cost"];
    var item_type = budget_data[i]["Type"];
    var ItemDescription = Panel_(ui, css.panel, css.budgetdatarow).add(Urlify_(ui, item_description).setId("ItemDescription").setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE)).setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE);
    var ItemCost = Label_(ui, Currency_(item_cost), css.budgetdatagridlabel, css.label).setWordWrap(false).setHorizontalAlignment(UiApp.HorizontalAlignment.RIGHT).setId("ItemCost");
    var ItemType = Label_(ui, item_type, css.budgetdatagridlabel).setWordWrap(false).setHorizontalAlignment(UiApp.HorizontalAlignment.CENTER).setId("ItemType");
    var EditDescription = TextBox_(ui, "EditDescription", css.textbox, css.fullwidth).setValue(item_description).setVisible(false);
    var EditCost = TextBox_(ui, "EditCost").setValue(item_cost).setVisible(false);
    var EditType = Listbox_(ui, "EditType", item_type, [["Grant"],["Applicant"],["Divider"],["Subtotal"]]).setVisible(false);
    
    if (item_type == "Divider") {
      ItemDescription = Panel_(ui, css.panel, css.budgetdatarow).add(Urlify_(ui, item_description, css.bold).setId("ItemDescription").setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE)).setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE);
      BudgetDataGrid.setWidget(BudgetDataGridLastRow, 0, HPanel_(ui, css.hpanel, css.fullwidth, css.bold).add(ItemDescription).add(EditDescription));
      if (Trim_(item_description) != "") BudgetDataGrid.setRowStyleAttributes(BudgetDataGridLastRow, css.divider);
      BudgetDataGrid.setRowStyleAttributes(BudgetDataGridLastRow, css.bold);
    } else if (item_type == "Subtotal")  {
      ItemCost.setText(Currency_(new Number(subtotal).toFixed(2))).setStyleAttributes(css.bold);
      ItemDescription = Panel_(ui, css.panel, css.budgetdatarow).add(Urlify_(ui, item_description, css.bold).setId("ItemDescription").setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE)).setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE);
      BudgetDataGrid.setWidget(BudgetDataGridLastRow, 0, HPanel_(ui, css.hpanel, css.fullwidth).add(ItemDescription).add(EditDescription));
      BudgetDataGrid.setWidget(BudgetDataGridLastRow, 1, HPanel_(ui, css.hpanel, css.fullwidth).add(ItemCost).add(EditCost));
      BudgetDataGrid.setRowStyleAttributes(BudgetDataGridLastRow, css.subtotal)
      .setRowStyleAttributes(BudgetDataGridLastRow, css.bold);
      subtotal = 0;
    } else if (item_type == "Grant" || item_type == "Applicant") {
      BudgetDataGrid.setWidget(BudgetDataGridLastRow, 0, HPanel_(ui, css.hpanel, css.fullwidth).add(ItemDescription).add(EditDescription));
      BudgetDataGrid.setWidget(BudgetDataGridLastRow, 1, HPanel_(ui, css.hpanel, css.fullwidth).add(EditCost).add(ItemCost));
      BudgetDataGrid.setRowStyleAttributes(BudgetDataGridLastRow, css.rowodd);
      subtotal += parseFloat(item_cost);
      total += parseFloat(item_cost);
      if (item_type == "Grant") grant_total += parseFloat(item_cost);
      else non_grant_total += parseFloat(item_cost);
    }
    BudgetDataGrid.setWidget(BudgetDataGridLastRow, 2, HPanel_(ui, css.hpanel, css.fullwidth).add(ItemType).add(EditType));
    
    var SaveHandler = ui.createServerHandler("SaveBudgetItemClickHandler_");
    var SaveButton = Button_(ui, "SaveButton", "Save", SaveHandler, css.buttonblue, css.buttonbluehover).setVisible(false);
    SaveHandler.addCallbackElement(SaveButton)
      .addCallbackElement(EditDescription)
      .addCallbackElement(EditCost)
      .addCallbackElement(EditType)
      .addCallbackElement(Hidden_(ui, "row_id", item_id))
      .addCallbackElement(Hidden_(ui, "app_id", app_id));
    SaveButton.addClickHandler(SaveHandler);
    SaveButton.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setStyleAttributes(css.buttonbluedisabled).setText("Saving..."));
      
    var EditButtonHandler = ui.createClientHandler();
    var EditButton = Button_(ui, "EditButton", "Edit", EditButtonHandler, css.buttonblue, css.buttonbluehover);
    EditButtonHandler
      .forTargets(EditDescription, EditCost, EditType, SaveButton).setVisible(true)
      .forTargets(EditButton).setEnabled(false).setVisible(false)
      .forTargets(ItemDescription, ItemCost, ItemType).setVisible(false).setEnabled(false)
      .forTargets(EditDescription).setStyleAttributes(css.fullwidth);
    EditButton.addClickHandler(EditButtonHandler);
    
    var DeleteHandler = ui.createServerHandler("DeleteBudgetItemClickHandler_");
    var DeleteButton = Button_(ui, "DeleteButton", "Delete", DeleteHandler, css.buttonred, css.buttonredhover);
    DeleteHandler.addCallbackElement(DeleteButton)
    .addCallbackElement(Hidden_(ui, "row_id", item_id))
    .addCallbackElement(Hidden_(ui, "app_id", app_id));
    DeleteButton.addClickHandler(DeleteHandler);
    DeleteButton.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setStyleAttributes(css.buttonreddisabled).setText("Deleting..."));
    
//    BudgetDataGrid.setRowStyleAttributes(BudgetDataGridLastRow, css.budgetdatarow);

    if (edit) BudgetDataGrid.setWidget(BudgetDataGridLastRow, 3, HPanel_(ui, css.hpanel, css.fullwidth).add(EditButton).add(SaveButton).add(DeleteButton));
    
    BudgetDataGridLastRow++;
    
    sw.lap("Budget Grid Row"); 

  }
  
  BudgetDataGrid.setWidget(BudgetDataGridLastRow, 0, Label_(ui, "TOTAL GRANT FUNDS REQUESTED", css.budgettotal));
  BudgetDataGrid.setWidget(BudgetDataGridLastRow, 1, Label_(ui, Currency_(grant_total), css.budgettotal).setHorizontalAlignment(UiApp.HorizontalAlignment.RIGHT));
  BudgetDataGrid.setRowStyleAttributes(BudgetDataGridLastRow, css.budgetdatagridsubtotal);

  BudgetDataGridLastRow++;
  BudgetDataGrid.setWidget(BudgetDataGridLastRow, 0, Label_(ui, "TOTAL NON-GRANT FUNDS", css.budgettotal));
  BudgetDataGrid.setWidget(BudgetDataGridLastRow, 1, Label_(ui, Currency_(non_grant_total), css.budgettotal).setHorizontalAlignment(UiApp.HorizontalAlignment.RIGHT));
  BudgetDataGrid.setRowStyleAttributes(BudgetDataGridLastRow, css.budgetdatagridsubtotal);

  BudgetDataGridLastRow++;
  BudgetDataGrid.setWidget(BudgetDataGridLastRow, 0, Label_(ui, "TOTAL PROJECT COST", css.budgettotal));
  BudgetDataGrid.setWidget(BudgetDataGridLastRow, 1, Label_(ui, Currency_(total), css.budgettotal).setHorizontalAlignment(UiApp.HorizontalAlignment.RIGHT));
  BudgetDataGrid.setRowStyleAttributes(BudgetDataGridLastRow, css.budgetdatagridtotal);

  
  if (edit) {
    BudgetDataGridLastRow++;
    
    var NewBudgetDescription = TextBox_(ui, "NewBudgetDescription", css.textbox, css.fullwidth);
    BudgetDataGrid.setWidget(BudgetDataGridLastRow, 0, NewBudgetDescription);
    var NewBudgetAmount = TextBox_(ui, "NewBudgetAmount");
    BudgetDataGrid.setWidget(BudgetDataGridLastRow, 1, NewBudgetAmount);
    var NewBudgetEligible = Listbox_(ui, "NewBudgetEligible", "", [["Grant"], ["Applicant"], ["Divider"], ["Subtotal"]]);
  
    BudgetDataGrid.setWidget(BudgetDataGridLastRow, 2, NewBudgetEligible);
    var AddBudgetItemClickHandler = ui.createServerHandler("AddBudgetItemClickHandler_");
    var NewBudgetAdd = Button_(ui, "NewBudgetAdd", "Add", AddBudgetItemClickHandler, css.buttonblue, css.buttonbluehover);
    AddBudgetItemClickHandler.addCallbackElement(NewBudgetDescription)
                             .addCallbackElement(NewBudgetAmount)
                             .addCallbackElement(NewBudgetEligible)
                             .addCallbackElement(ui.getElementById("BudgetEntryPanel"))
                             .addCallbackElement(NewBudgetAdd)
                             .addCallbackElement(Hidden_(ui, "app_id", app_id));
    BudgetDataGrid.setWidget(BudgetDataGridLastRow, 3, NewBudgetAdd);
    NewBudgetAdd.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setStyleAttributes(css.buttonbluedisabled).setText("Adding..."));

    BudgetEntryPanel.clear();
    BudgetEntryPanel.add(Paragraph_(ui, 
                                    Panel_(ui)
                               .add(Label_(ui, "Enter all costs associated with your project", css.questionheader))
                               .add(HTML_(ui, 
                                     "Add a line by entering the information into the fields below and clicking the Add button.  Click the " + 
                                     "Delete button to permanently delete a line.  Click Edit to edit a line and Save the edited line.  You " +  
                                     "probaby shouldn't add/edit more than one line at a time.  Don't get fancy. Describe ALL costs associated " + 
                                     "with bringing your project to Apogaea below.  Several types of entries are allowed:" + 
                                     UL_( [
                                           "Grant - Apogaea grant funds will pay for this item", 
                                           "Applicant - The grant applicant will provide this item.  Grant funds will not be used for this item.",
                                           "Divider - Adds a line that has no numerical value for organizing your project costs.  Any value entered into the Cost field is ignored.",
                                           "Subtotal - Some people like to break their application into sections.  Inserting this link adds up all the costs since the beginning of " + 
                                           "your budget (or the most recent subtotal line, whichever is relevant)" 
                                          ]), 
                                     css.hint
                                   ))
                                .add(Label_(ui, "If things aren't working, try refreshing the page.", css.label, css.bold))
                              )
//    .setStyleAttributes({paddingLeft:"0px"})
    );

    sw.lap("Budget Grid Edit Row"); 


  }
  
  BudgetEntryPanel.add(BudgetDataGrid);

  var ValuePanel = ui.getElementById("ValuePanel");
  ValuePanel.clear();
  ValuePanel.add(Paragraph_(ui, Panel_(ui)
//                 .add(Label_(ui, ""))
                 .add(HTML_(ui, UL_(
                                     [
                                       "The applicant is requesting " + Currency_(Application.getRequestedGrantAmount()) + " in grant funds from Apogaea", 
                                       "That is " + Application.getPercentFunded().toFixed(2).toString() +  "% of the " + Currency_(Application.getTotalProjectCost()) + " total project cost",
                                       "Each grant dollar awarded to this grant buys " + Currency_(Application.getGrantValue()) + " of art.",
                                       "This grant would account for approximately " + Currency_(Application.getGrantTicketAmount()) + " of each " + Currency_(Application.getTicketPrice()) + " ticket.",
                                       "This grant is " + Application.getGrantAsPercentOfCurrentRoundBudget().toFixed(2).toString() + "% of the " + Currency_(Application.getRoundBudget()) + " grant budget for this round."
                                     ])
                           )
                      )
                 )
//                 .setStyleAttributes({paddingLeft:"0px", paddingTop:"5px"})
                );

  return ui;

}

function SaveBudgetItemClickHandler_(e) {
  var properties = PropertiesService.getScriptProperties();  
  var ui = UiApp.getActiveApplication();
  var lock = LockService.getScriptLock();
  var Application = new Application_(e.parameter.app_id);
  var BudgetSheet = new Sheet_(Application.getApplication().getSheetByName("Budget"));

  var sanitized_amount = e.parameter.EditCost;
  sanitized_amount = new Number(sanitized_amount.replace(/[^0-9.]+/gi, ""));
  if (isNaN(sanitized_amount)) sanitized_amount = 0;

  var row = {};
  row["Description"] = Trim_(e.parameter.EditDescription);
  row["Cost"] = sanitized_amount;
  row["Type"] = Trim_(e.parameter.EditType);

  lock.waitLock(properties.getProperty("lock_timeout"));
  BudgetSheet.updateRow("Budget ID", e.parameter.row_id, row)
  lock.releaseLock();

  UpdateBudgetDataGrid_(ui, new Application_(Application.getId()));
  
  return ui;
}

function DeleteBudgetItemClickHandler_(e) {
  var properties = PropertiesService.getScriptProperties();  
  var ui = UiApp.getActiveApplication();
  var lock = LockService.getScriptLock();
  var Application = new Application_(e.parameter.app_id);
  var BudgetSheet = new Sheet_(Application.getApplication().getSheetByName("Budget"));
  lock.waitLock(properties.getProperty("lock_timeout"));
  BudgetSheet.deleteRow("Budget ID", e.parameter.row_id);
  lock.releaseLock();
  UpdateBudgetDataGrid_(ui, new Application_(Application.getId()));
  return ui;
}

function AddBudgetItemClickHandler_(e) {
  var properties = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  var ui = UiApp.getActiveApplication();
  var Application = new Application_(e.parameter.app_id);
  var BudgetSheet = new Sheet_(Application.getApplication().getSheetByName("Budget"));
  lock.waitLock(properties.getProperty("lock_timeout"));

  var IdRange = Application.getBudget();
  var id = 1;
  
  for (var i = 0; i < IdRange.length; i++) {
    var cur_id = parseInt(IdRange[i]["Budget ID"]);
    if (cur_id >= id) id = cur_id + 1;
  }
 
  var sanitized_amount = e.parameter.NewBudgetAmount;
  sanitized_amount = new Number(sanitized_amount.replace(/[^0-9.]+/gi, ""));
  if (isNaN(sanitized_amount)) sanitized_amount = 0;
  
  BudgetSheet.insertRow({
              "Budget ID": id,
              "Description": e.parameter.NewBudgetDescription,
              "Cost": sanitized_amount, 
              "Type": e.parameter.NewBudgetEligible
  });
  
  lock.releaseLock();
  UpdateBudgetDataGrid_(ui, Application);
  return ui;
}

function ErrorCheckButtonClickHandler_(e) {
  
  var ui = UiApp.getActiveApplication();
  var Application = new Application_(e.parameter.app_id);
  var app = Application.getApplication();

  try {  
    ui.getElementById("ErrorCheckButton").setEnabled(true).setText("Save and check for errors").setStyleAttributes(css.buttonred);
    
    var ErrorsDb = new MemDB_(Application.preFlight());
    var Responses = Application.getResponses();
      
    for (var i = 0; i < Responses.length; i++) {
      var id = Responses[i]["Key"].replace(/\s*/, "");
      var error_id = id + "Error";
      var error_panel_id = id + "ErrorPanel";
      var error_message = ErrorsDb.clearFilters().addFilter({"Key":id}).getData();
      ui.getElementById(id).setText(Responses[i]["Value"]);
      if (error_message.length > 0) {
        var msg = "";
        for (var e = 0; e < error_message.length; e++) { msg += error_message[e]["Error"]; msg += ". "; }
        ui.getElementById(error_id).setVisible(true).setText(msg);
        ui.getElementById(error_panel_id).setStyleAttributes(css.errorbackgroundactive);
      } else {
        ui.getElementById(error_id).setVisible(false).setText("");
        ui.getElementById(error_panel_id).setStyleAttributes(css.errorbackground);
      }
    }
    
    var ErrorCheckMsg = ui.getElementById("ErrorCheckMsg");
    var Errors = ErrorsDb.clearFilters().getData();
    if (Errors.length > 0) {
      ErrorCheckMsg.clear();
      ErrorCheckMsg.add(Label_(ui, "The Grant Robot has found these issues with your application:", css.errorlabel, css.shimbottom));
      var msgs = [];
      for (var i = 0; i < Errors.length; i++) msgs.push(Errors[i]["Error"]);
      var Html = HtmlService.createTemplate(UL_(msgs));
      ErrorCheckMsg.add(HTML_(ui, Html.evaluate().getContent(), css.errorlabel));
      ErrorCheckMsg.add(Label_(ui, "Fix any errors listed above and re-check your application.", css.errorlabel));
      ErrorCheckMsg.setVisible(true);
  
    } else {
      ErrorCheckMsg.clear();
      ErrorCheckMsg.add(Label_(ui, "Congratulations!  The Grant Robot didn't find any errors with your application.  As currently entered, this application is complete and error-free.  It will be submitted for consideration at the deadline.  " + 
                                  "If you edit your application, you must check for errors again.", css.label, css.bold, css.green)); 
      ErrorCheckMsg.setVisible(true);
    }
  } catch (err) {
    Logger.log(err.toString());
  }
  return ui;

}

function AutoSaveHandler_(e) {
  var ui = UiApp.getActiveApplication();
  var Application = new Application_(e.parameter.app_id);
  var responses = Application.getResponses();
  var updates = false;
  for (var i = 0; i < responses.length; i++) {
    var key = responses[i]["Key"];
    if (!e.parameter.hasOwnProperty(key)) continue;
    var value = Trim_(e.parameter[key]);
    try {
      if (value != "" && responses[i]["Value"] != value) {
        Application.setResponseValue(key, value);
        updates = true;
      }
    } catch (err) {
      Logger.log("AutoSave Error: " + err.toString());
    }
  }
  if (updates) {
    Application.clearCache("Responses");
  } 
  return ui;
}

function AlternateNameHandler_(e) {
  var ui = UiApp.getActiveApplication();
  if (e.parameter["AlternateName"] == "" && e.parameter["LegalName"] != "") {
    var first_name = String(e.parameter["LegalName"]).replace(/\s+\w+/g, "");
    ui.getElementById("AlternateName").setText(first_name);
  }
  return ui;
}

function GetEmailUi_(e, properties) {
  var ui = Ui_(properties, "Apply for an Apogaea " + properties.getProperty("round_name") + " Grant");

  var Content = Content_(ui);
  ui.add(Content);
  
  Content.add(Header_(ui, properties));
  Content.add(Section_(ui, "Begin your grant application"));

  var EmailEntry = Panel_(ui).setId("EmailEntry");  
  EmailEntry.add(
      Paragraph_(ui, 
                  Urlify_(ui, 
                          "Thank you for taking the time to apply for an Apogaea grant.  To get started, please enter a valid " + 
                          "email address we can use to communicate with you.  Once the grant process begins, we will send important " + 
                          "emails to this address.  Make sure to check your email regularly. If you haven't received an email from us " + 
                          "within 24 hours of your submission, " + 
                          "check your spam folder for an email with 'We're ready to begin your Apogaea grant application!' in the subject " + 
                          "line.  If all else fails, notify " + properties.getProperty("help_email") + " and we'll try to sort it out."
                         )
                )
  );
  
  Content.add(EmailEntry);

  var Email = TextBox_(ui, "Email");
  var EmailQuestion = Question_(ui, Email, "Enter your email address", "This should be an address that you check regularly.");
  var EmailFormPanel = Panel_(ui, css.paragraph, css.indent).add(EmailQuestion);
  EmailEntry.add(EmailFormPanel);
  
  var Success = Panel_(ui)
                        .setVisible(false)
                        .setId("Success")
                        .add(Paragraph_(ui, 
                                        Urlify_(ui, "An email has been sent to the address you provided.  Generally you should receive this within 5-10 minutes.  " + 
                                         "Follow the instructions in the email to continue filling out your grant application.  " + 
                                         "If you do not receive an email from apogaea.com within 24 hours, check your spam folder.  If it isn't in there, email " + 
                                         properties.getProperty("help_email") + " for assistance.   Thanks!",
                                         css.label, css.bold)
                             )
                        );
    
  var submitButtonHandler = ui.createServerHandler("GetEmailSubmitHandler_");
  var submitButton = Button_(ui, "submitButton", "Enter a valid email", submitButtonHandler, css.buttonred, css.buttonredhover).setEnabled(false).setStyleAttributes(css.buttonreddisabled);
  var submitClientHandler = ui.createClientHandler().forEventSource().setEnabled(false).setText("Checking...").setStyleAttributes(css.buttonreddisabled);
  var emailKeyUpValidHandler = ui.createClientHandler().validateEmail(Email).forTargets(submitButton).setEnabled(true).setText("Get started!").setStyleAttributes(css.buttonred);
  var emailKeyUpNotValidHandler = ui.createClientHandler().validateNotEmail(Email).forTargets(submitButton).setEnabled(false).setText("Enter a valid email").setStyleAttributes(css.buttonreddisabled);
  var emailKeyUpNotApoHandler = ui.createClientHandler().validateMatches(Email, ".*apogaea.com$", "i").forTargets(submitButton).setEnabled(false).setText("You can not use an apogaea.com email address to apply for a grant.").setStyleAttributes(css.buttonreddisabled);
  
  Email.addKeyUpHandler(emailKeyUpNotValidHandler);
  Email.addKeyUpHandler(emailKeyUpValidHandler);
  Email.addKeyUpHandler(emailKeyUpNotApoHandler);
  submitButton.addClickHandler(submitClientHandler);
  submitButtonHandler.addCallbackElement(Email);
  submitButtonHandler.addCallbackElement(submitButton);
  submitButtonHandler.addCallbackElement(EmailEntry);
  Content.add(Success);
  EmailQuestion.add(submitButton);
  Content.add(Footer_(ui, properties));
  
  return ui;
}

function GetEmailSubmitHandler_(e) {
  var lock = LockService.getScriptLock();
  var ui = UiApp.getActiveApplication();
  var properties = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(properties.getProperty("robot_id"));
  var sheet = new Sheet_(ss.getSheetByName("New")).cacheOff();
  var db = new MemDB_(sheet.getData());
  var check = db.addFilter({"Email": e.parameter.Email}).getData();
  if (check.length != 0) {
    ui.getElementById("EmailEntry").setVisible(true);
    ui.getElementById("EmailError").setVisible(true)
                                    .setText("It looks like this email has already been used.  " + 
                                    "If you have not received an email from apogaea.com within 24 hours of your " + 
                                    "initial submission, check your spam folder.  If it isn't in there, or you just " + 
                                    "need us to resend the link to your application, email " + 
                                     properties.getProperty("help_email") + " for assistance.   Thanks!");
    ui.getElementById("submitButton").setEnabled(false).setText("Enter a valid email").setStyleAttributes(css.buttonred);
    lock.releaseLock();
    return ui;
  }
  lock.waitLock(properties.getProperty("lock_timeout"));
  sheet.insertRow({"Email":e.parameter.Email});
  lock.releaseLock();
  ui.getElementById("EmailError").setVisible(false).setText("");
  ui.getElementById("EmailEntry").setVisible(false);
  ui.getElementById("Success").setVisible(true);
  return ui;
}

function ViewUi_(e, Application, properties, user) {
  
  Application.clearCache();
 
  var ProjectName = Application.getResponseValue("ProjectName");
  if (ProjectName == "") ProjectName = "(untitled)";
  
  var ui = Ui_(properties, ProjectName + " - View");

  var Content = Content_(ui).setId("RobotContent");
  ui.add(Content);
  
  var app_id = Application.getId();
  var appIdHidden = ui.createHidden("app_id", app_id);
  Content.add(appIdHidden);
  
  var HeaderUiPanel = Header_(ui, properties);

  HeaderUiPanel.add(Section_(ui, ProjectName));
  var HeaderExtra = Panel_(ui);
  
  if (user.isCat) {
    // show full applicant info to CATS
    HeaderExtra.add(Label_(ui, Application.getResponseValue("LegalName") + " (" + Application.getResponseValue("AlternateName") + ")", css.label, css.labellarge, css.shimright));
    HeaderExtra.add(Anchor_(ui, Application.getConfigurationValue("Email"), "mailto:" + Application.getConfigurationValue("Email"), css.label, css.labellarge));
  } else if (user.isIgnition) {
    // show email to Ignition
    HeaderExtra.add(Label_(ui, Application.getResponseValue("AlternateName"), css.label, css.labellarge, css.shimright));
    HeaderExtra.add(Anchor_(ui, Application.getConfigurationValue("Email"), "mailto:" + Application.getConfigurationValue("Email"), css.label, css.labellarge));
  } else {
    // only show alternate name
    HeaderExtra.add(Label_(ui, Application.getResponseValue("AlternateName"), css.label, css.labellarge, css.shimright));
  }
  HeaderExtra.add(Label_(ui, "Category: " + Application.getResponseValue("Category"), css.label, css.bold)); 
  HeaderExtra.add(Label_(ui, "Rating: " + Application.getResponseValue("Rating"), css.label, css.bold));
  HeaderExtra.add(Label_(ui, "Generator: " + Application.getResponseValue("HasGenerator"), css.label, css.bold));
  HeaderExtra.add(Label_(ui, "Fire/Fuel: " + Application.getResponseValue("HasFire"), css.label, css.bold));
  HeaderExtra.add(Label_(ui, "Sound: " + Application.getResponseValue("HasSound"), css.label, css.bold));
  var promo = Application.getResponseValue("Promo");
  if (promo != "") {
    HeaderExtra.add(Label_(ui, "Project Promotions / Website:", css.label, css.bold));
    HeaderExtra.add(Urlify_(ui, promo));
  } else {
    HeaderExtra.add(Label_(ui, "Project Promotions / Website: (blank)", css.label, css.bold));
  }
  
  HeaderUiPanel.add(Paragraph_(ui, HeaderExtra));  
  Content.add(HeaderUiPanel);

  var CoiSection = Panel_(ui).setId("CoiSection").setVisible(false);
  Content.add(CoiSection);

  var ProjectInfoContent = Panel_(ui);
  ProjectInfoContent.add(Section_(ui, "Project Description").setStyleAttributes({borderColor:"#ff9900"}));
  ProjectInfoContent.add(Paragraph_(ui, Urlify_(ui, Application.getResponseValue("Description"))));
  ProjectInfoContent.add(Panel_(ui, css.paragraph, css.indent).setId("CATSDescriptionQuestions").setVisible(false));
  ProjectInfoContent.add(Section_(ui, "Logistics / Placement"));
  ProjectInfoContent.add(Paragraph_(ui, Urlify_(ui, Application.getResponseValue("Logistics"))));
  ProjectInfoContent.add(Panel_(ui, css.paragraph, css.indent).setId("CATSLogisticsQuestions").setVisible(false));
  ProjectInfoContent.add(Section_(ui, "Team"));
  ProjectInfoContent.add(Paragraph_(ui, Urlify_(ui, Application.getResponseValue("Team"))));
  ProjectInfoContent.add(Panel_(ui, css.paragraph, css.indent).setId("CATSTeamQuestions").setVisible(false));
  ProjectInfoContent.add(Section_(ui, "Safety"));
  ProjectInfoContent.add(Paragraph_(ui, Urlify_(ui, Application.getResponseValue("Safety"))));
  ProjectInfoContent.add(Panel_(ui, css.paragraph, css.indent).setId("CATSSafetyQuestions").setVisible(false));
  if (Application.getResponseValue("Category") == "Effigy" || Application.getResponseValue("Category") == "Temple") {
    ProjectInfoContent.add(Section_(ui, "Effigy/Temple Ownership"));
    ProjectInfoContent.add(Paragraph_(ui, Urlify_(ui, Application.getResponseValue("Ownership"))));
  }
  
  Content.add(ProjectInfoContent);
  
  var BudgetSection = Section_(ui, "Project Costs / Value").setId("BudgetPanel");
  var BudgetEntryPanel = Panel_(ui).setId("BudgetEntryPanel");
  var ValueSection = Section_(ui, "Financial Summary");
  var ValuePanel = Panel_(ui).setId("ValuePanel");
  
  var addl_income = Application.getResponseValue("AdditionalIncome");
  if (addl_income == "") addl_income = "(blank)";

  var fund_plan = Application.getResponseValue("FundingPlan");
  if (fund_plan == "") fund_plan = "(blank)";

  BudgetSection.add(BudgetEntryPanel);
  BudgetSection.add(Section_(ui, "Additional Sources of Income"));
  BudgetSection.add(Paragraph_(ui, Urlify_(ui, addl_income)));
  BudgetSection.add(Section_(ui, "Funding Options"));
  BudgetSection.add(Paragraph_(ui, Urlify_(ui, fund_plan)));

  Content.add(BudgetSection);
  Content.add(ValueSection);
  Content.add(ValuePanel);
  Content.add(Panel_(ui, css.paragraph, css.indent).setId("CATSBudgetQuestions").setVisible(false));
  UpdateBudgetDataGrid_(ui, Application, false);

  Content.add(Panel_(ui).setId("FilesList"));
  FileList_(ui, Application, {showDelete:false});
  
  var QuestionHandler = ui.createServerHandler("QuestionSaveButtonClickHandler_");
  var QuestionsSection = Section_(ui, "Questions from CATS about this application").setId("QuestionsSection").setVisible(false);
  Content.add(QuestionsSection);
  QuestionHandler.addCallbackElement(QuestionsSection);
  Questions_(ui, Application, properties, user, {showAsk: user.isCat, showResponse: false});

  if ((user.isEditor || user.isIgnition) && Application.getConfigurationValue("Application Final") == "Yes") {
    
    ui.setTitle(ProjectName + " - Final Score");

    var FinalScoreSection = ui.createVerticalPanel().setId("FinalScoreSection");
    Content.add(FinalScoreSection);
    
    var OverallSection = Panel_(ui);
//    FinalScoreSection.add(Section_(ui, "CATS Overall Score").add(OverallSection));
  
    var Section = Panel_(ui);

    var ScoreSheet = new Sheet_(Application.getApplication().getSheetByName("Score"));
    var Scores = ScoreSheet.getData();
    var ScoresDb = new MemDB_(Scores);
    var Comments = ScoresDb.addFilter({"Question ID":"O2"}).getData()[0];
    var CATS = new MemDB_(GetCATS_()).addExclude({Email:"grantrobot@apogaea.com"}).getData();
    
    var ResultGrid = ui.createFlexTable().setStyleAttributes(css.budgetdatagrid).setBorderWidth(0).setCellSpacing(1).setCellPadding(3)
//    ResultGrid.setWidget(0, 0, Label_(ui, "Score", css.budgetdatagridheaderlabel));
//    ResultGrid.setWidget(0, 0, Label_(ui, "Comments", css.budgetdatagridheaderlabel));
//    ResultGrid.setRowStyleAttributes(0, css.budgetdatagridheader);
//    ResultGrid.setColumnStyleAttributes(0, css.fullwidth);
    
    var NoAbstain = [];
    var overall_score = -1;
    var comment_row = 0;
    for (var i = 0; i < CATS.length; i++) {
      
      var cat = CATS[i].Email;
      Logger.log(JSON.stringify(CATS[i]));
      var cat_score = ScoresDb.clearFilters().addFilter({"Question ID":"SCORE1"}).getData()[0][cat];
      if (cat_score == undefined || cat_score == "" || cat_score == 0) cat_score = "Abstain"; 
      if (cat_score != "Unscored" && cat_score != "Abstain") NoAbstain.push(cat);
      if (Trim_(Comments[cat]) != "") {
        ResultGrid.setWidget(comment_row, 0, Panel_(ui, css.indentedparagraphwhite).add(Urlify_(ui, CATS[i]["Short Name"] + " ( " + cat + " ) said:", css.bold))
                             .add(Spacer_(ui))
                             .add(Label_(ui, Comments[cat])));
        ResultGrid.setRowStyleAttribute(comment_row, "background-color", "#FFFFFF")
        comment_row++;
      }
    }
  
    var QuestionIds = ["D1","D2","D3","D4","D5","D6","D7","D8","L1","L2","L3","L4","L5","L6","L7","L8","L9","L10","S1","S2","S3","S4","S5","S6","T1","T2","T3","T4","T5","B1","B2","B3","B4","B5","O1"];
    
    var DetailGrid = ui.createFlexTable().setStyleAttributes(css.budgetdatagrid).setBorderWidth(0).setCellSpacing(1).setCellPadding(3);
  
    DetailGrid.setWidget(0, 0, Label_(ui, "Score", css.budgetdatagridheaderlabel));
    DetailGrid.setWidget(0, 1, Label_(ui, "Question", css.budgetdatagridheaderlabel));
    DetailGrid.setRowStyleAttributes(0, css.budgetdatagridheader);
    DetailGrid.setColumnStyleAttributes(1, css.fullwidth);
  
    var total_score = 0;
    
    for (var q = 0; q < QuestionIds.length; q++) {
      
      var q_score = 0;
      var question = ScoresDb.clearFilters().addFilter({"Question ID":QuestionIds[q]}).getData()[0];
      
      for (var c = 0; c < NoAbstain.length; c++) {
        q_score += question[NoAbstain[c]];
      }
      
      q_score = q_score / NoAbstain.length;
      total_score += q_score;
  
      var result = 0;
      if (QuestionIds[q] == "O1") result = (q_score * 100) / 5;
      else result = q_score * 100;
      if (result == undefined) result = 0;
      result = result.toFixed(0).toString();
          
      DetailGrid.setWidget(q + 1, 0, Label_(ui, result + "%", css.budgetdatarow, css.label, css.bold).setHorizontalAlignment(UiApp.HorizontalAlignment.CENTER));
  //    DetailGrid.setWidget(q + 1, 1, Label_(ui, question["Section"], css.budgetdatarow));
      DetailGrid.setWidget(q + 1, 1, Label_(ui, question["Description"], css.budgetdatarow, css.label));
      DetailGrid.setRowStyleAttribute(q + 1, "background-color", "#FFFFFF");
  
    }
  
//    OverallSection.add(Paragraph_(ui, Panel_(ui).add(Label_(ui, "Overall score: " + total_score.toFixed(3).toString(), css.labellarge, css.bold))
//                .add(Spacer_(ui))
//                .add(Label_(ui, "The maximum score for an application is 39, the sum of 34, 1 point questions,  and 1, 5 point question.  The overall score for application is the average of the individual CATS scores.  Abstains are not counted in the average.")))
//    );
    
    Section.add(ResultGrid);
    
    var DetailSection = Panel_(ui);
    FinalScoreSection.add(Section_(ui, "CATS Score Detail").add(DetailSection));
    DetailSection.add(Paragraph_(ui, Label_(ui, "The percentages are a reflection of the number of CATS who felt your application answered/addressed the question.  A perfect score is 100%.  This means all CATS were in agreement that the application answered/addressed the question.  Higher numbers indicate that most CATS felt the application answered/addressed this question.  Lower numbers indicate that most CATS did not feel the application adequately answered/addressed this question.")));
    DetailSection.add(Spacer_(ui));
    DetailSection.add(DetailGrid);

    FinalScoreSection.add(Section_(ui, "CATS Comments").add(Section));

  }
  
  if (!user.isCat) {

    var popUp = ui.createPopupPanel();
    var captionPanel = ui.createCaptionPanel();
    var PopupCloseHandler = ui.createClientHandler().forTargets(popUp).setVisible(false);
    var PopupCloseButton = Button_(ui, "PopupClose", "Close", PopupCloseHandler, css.buttonblue, css.buttonbluedisabled);
    popUp.add(captionPanel)
    .setWidth("600px")//.setHeight("600px")
    .setPopupPosition(100, 100);
    captionPanel.add(Panel_(ui).add(Label_(ui, "If you are a member of CATS, the robot doesn't think you are logged in to your Ignition account.", css.errorlabellarge))
    .add(Spacer_(ui))
    .add(Urlify_(ui, "For some reason Google doesn't think you're logged in to your Ignition account.  " + 
                        "If you're logged in to any other Google accounts, try logging out of those and only " + 
                        "logging in to your Ignition account.  What you should really do is start using this " + 
                        "method to manage multiple user accounts in Chrome.  If you don't use Chrome, try opening " + 
                        "a \"private browsing\" type window and log in there. See this article for suggestions: https://support.google.com/chrome/answer/2364824?hl=en Or open a new incognito/private browsing type window and log in to your Ignition acocunt there.", css.errorlabel))
                     .add(Spacer_(ui))
                     .add(Label_(ui, "If you are the applicant and are trying to edit your application, use the link we sent you in the email when you began your application.", css.errorlabellarge))
                     .add(Spacer_(ui))
                     .add(Label_(ui, "This page is used to show the applicant how the CATS will view their application.", css.errorlabel))
                     .add(Spacer_(ui))
                     .add(PopupCloseButton)
                    );
    if (Application.getConfigurationValue("Application Final") != "Yes") popUp.show();
    
    
  }

  
//  if (properties.getProperty("log_views") == "Yes" && user.isCat) {
  if (properties.getProperty("log_views") == "Yes") {
        
    var log_email = user.Email; 
    if (log_email == "") log_email = "ANONYMOUS VIEWER";

    var new_date = new Date();
    
    var update = {"Email":log_email,
                  "Application ID":Application.getId(),
                  "Date Time":Utilities.formatDate(new_date, Session.getScriptTimeZone(), "M/d/yyyy HH:mm:ss"),
                  "Date":Utilities.formatDate(new_date, Session.getScriptTimeZone(), "M/d/yyyy"),
                  "Unique Index":log_email+Application.getId()
                 };
    var Robot = new Robot_();
    var view_log_sheet = new Sheet_(Robot.getRobot().getSheetByName("View Log"));
    view_log_sheet.insertRow(update);
  }

  return ui;
  
}

function Questions_(ui, Application, properties, user, new_options) {

  var options = {
    showAsk: true,
    showResponse: true
  };
  
  for (var o in options) {
    if (new_options != undefined && new_options.hasOwnProperty(o)) options[o] = new_options[o];
  }
  
  var QuestionsSection = ui.getElementById("QuestionsSection");
  QuestionsSection.clear().setVisible(true);
  
  var Section = Panel_(ui);
  QuestionsSection.add(Section_(ui, "Questions from CATS about this application").add(Section));

  if (user.isEditor) {
    Section.add(Paragraph_(ui, Label_(ui, "The question and answer period is from " + FormatDate_(properties.getProperty("cats_review_begin_date")) + " to " + FormatDate_(properties.getProperty("cats_review_end_date")) + ".  " + 
                                          "If CATS has questions about your application, you will be notified by email and given an opportunity to respond below.  All responses are considered final after " + 
                                            FormatExactDate_(properties.getProperty("applications_final_date")) + "."))).add(Spacer_(ui));
  }  
  var Questions = Application.getQuestions();
  
//  if (Questions.length <= 0 || Application.getConfigurationValue("CATS QnA Open") == "No") {
  if (Questions.length <= 0) {
    Section.add(Paragraph_(ui, Label_(ui, "No questions have been asked.", css.label, css.bold))).add(Spacer_(ui));
  } else {

    for (var i = 0; i < Questions.length; i++) {
      var Question = Panel_(ui);
      var response = Trim_(Questions[i]["Response"]);
      
      Question.add(Label_(ui, Questions[i]["Name"] + " asks:", css.label, css.bold));
      Question.add(Panel_(ui).add(Urlify_(ui, Questions[i]["Question"])));

      if (user.isCat && Application.getConfigurationValue("CATS QnA Open") == "Yes" && Questions[i]["Email"] == user.Email && response == "") {
        var d_handler = ui.createServerHandler("DeleteQuestionClickHandler_")
                            .addCallbackElement(QuestionsSection)
                            .addCallbackElement(ui.createHidden("question_id", Questions[i]["Question ID"]))
                            .addCallbackElement(ui.createHidden("app_id", Application.getId())
                          );
        var d = Button_(ui, "delete", "Cancel", d_handler, css.buttonred, css.buttonredhover); 
        d.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setText("Canceling...").setStyleAttributes(css.buttonreddisabled));

        d_handler.addCallbackElement(d);
        Question.add(Spacer_(ui));
        Question.add(d);
      }
      
      Question.add(Spacer_(ui));
      Question.add(Label_(ui, Application.getResponseValue("AlternateName") + " responds:", css.label, css.bold));
      
      if (!options.showResponse || user.isIgnition || Application.getConfigurationValue("Edit Open") == "No") {
//      if (Application.getConfigurationValue("Edit Open") == "No") {
        if (response == "") response = "(no response)";
        Question.add(Panel_(ui).add(Urlify_(ui, response)));
      
      } else {
      
        var q = TextArea_(ui, "response").setText(response);
        

        var q_handler = ui.createServerHandler("ResponseValueChangeHandler_")
                            .addCallbackElement(q)
                            .addCallbackElement(ui.createHidden("save_id", "save_button_" + i))
                            .addCallbackElement(ui.createHidden("question_id", Questions[i]["Question ID"]))
                            .addCallbackElement(ui.createHidden("app_id", Application.getId()));

        var save_button = Button_(ui, "save_button_" + i, "Save", q_handler, css.buttonblue, css.buttonbluehover).setVisible(false);
        save_button.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setText("Saving..."));

        q_handler.addCallbackElement(save_button);
        
        save_button.addClickHandler(q_handler);
        q.addValueChangeHandler(ui.createServerHandler("ResponseValueChangeHandlerUpdateButton_")
                                .addCallbackElement(save_button)
                                .addCallbackElement(ui.createHidden("save_id", "save_button_" + i)));
        q.addValueChangeHandler(q_handler);
        q.addKeyDownHandler(ui.createClientHandler().forTargets(save_button).setEnabled(true).setVisible(true));
 
        Question.add(Panel_(ui).add(q).add(save_button));
      
      }
      
      Section.add(Paragraph_(ui, Question));
    
    }
    
  }

  if (options.showAsk && user.isCat && Application.getConfigurationValue("CATS QnA Open") == "Yes") {

    var QuestionEntryPanel = Panel_(ui);
    var QuestionEntry = TextArea_(ui, "QuestionEntry");
    var QuestionSaveButtonClickHandler = ui.createServerHandler("QuestionSaveButtonClickHandler_");
    var QuestionSaveButton = Button_(ui, "QuestionSaveButton", "Ask question", QuestionSaveButtonClickHandler, css.buttonred, css.buttonredhover); 
  
    QuestionSaveButton.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setText("Asking question...").setStyleAttributes(css.buttonreddisabled));
  
    QuestionEntryPanel.add(Label_(ui, "Ask a question:", css.label, css.bold));
    QuestionEntryPanel.add(QuestionEntry);
    QuestionEntryPanel.add(QuestionSaveButton);
    
    QuestionSaveButtonClickHandler.addCallbackElement(ui.createHidden("app_id", Application.getId()))
                                 .addCallbackElement(ui.createHidden("email", user.Email))
                                 .addCallbackElement(ui.createHidden("ask_name", user.ShortName))
                                 .addCallbackElement(QuestionEntry)
                                 .addCallbackElement(QuestionSaveButton)
                                 .addCallbackElement(QuestionsSection);

    Section.add(Paragraph_(ui, QuestionEntryPanel));
  
  }
  
}

function QuestionSaveButtonClickHandler_(e) {

  var properties = PropertiesService.getScriptProperties();
  var ui = UiApp.getActiveApplication();
  var app_id = e.parameter.app_id;
  var Application = new Application_(app_id);
  var lock = LockService.getPublicLock();
  var question = Trim_(e.parameter.QuestionEntry);
      
  try {
  
    lock.waitLock(properties.getProperty("lock_timeout"));

    var questions_sheet = new Sheet_(Application.getApplication().getSheetByName("Questions")).cacheOff();
    var data = questions_sheet.getData();
    var new_id = 0;
    for (var i = 0; i < data.length; i++) {
      if (data[i]["Question ID"] > new_id) new_id = data[i]["Question ID"];
    }
    new_id++;

    var question = {
      "Question ID":new_id,
      "Date": new Date(),
      "Name": e.parameter.ask_name,
      "Question": question,
      "Email": e.parameter.email
    };
    
    questions_sheet.insertRow(question);
    
  } catch (err) {
    throw new Error("Unable to add question:" + err.toString()); 
  } finally {
    lock.releaseLock(); 
  }

  Questions_(ui, Application, properties, User_());

  return ui;

}

function DeleteQuestionClickHandler_(e) {
  var ui = UiApp.getActiveApplication();
  var lock = LockService.getScriptLock();
  var Application = new Application_(e.parameter.app_id);
  var sheet = new Sheet_(Application.getApplication().getSheetByName("Questions"));
  var properties = PropertiesService.getScriptProperties();
  lock.waitLock(properties.getProperty("lock_timeout"));
  sheet.deleteRow("Question ID", e.parameter.question_id);
  lock.releaseLock();
  Questions_(ui, Application, properties, User_());  
  return ui;
}

function ResponseValueChangeHandlerUpdateButton_(e) {
  var ui = UiApp.getActiveApplication();
  ui.getElementById(e.parameter.save_id).setEnabled(false).setText("Saving...").setStyleAttributes(css.buttonbluedisabled);
  return ui;
}

function ResponseValueChangeHandler_(e) { 
  var ui = UiApp.getActiveApplication();
  var lock = LockService.getPublicLock();
  var Application = new Application_(e.parameter.app_id);
  var QuestionsSheet = new Sheet_(Application.getApplication().getSheetByName("Questions"));
  var properties = PropertiesService.getScriptProperties();
  
  lock.waitLock(properties.getProperty("lock_timeout"));
  QuestionsSheet.updateRow("Question ID", e.parameter.question_id, {"Response":Trim_(e.parameter.response)});
  lock.releaseLock();
  
  ui.getElementById(e.parameter.save_id).setEnabled(true).setText("Save").setVisible(false).setStyleAttributes(css.buttonblue);
  
  return ui;
}

function ScoreUi_(e, Application, properties, user) {

  if (!user.isIgnition) return ErrorUi_("For some reason Google doesn't think you're logged in to your Ignition account.  If you're logged in to any other Google accounts, try logging out of those and only logging in to your Ignition account.  What you should really do is start using this method to manage multiple user accounts in Chrome.  If you don't use Chrome, try opening a \"private browsing\" type window and log in there. ");
  if (!user.isCat) return ErrorUi_("Only members of CATS may view this page.  If you're logged in to any other accounts, try logging out of those and only logging in to your CATS Ignition account.");

  var ui = ViewUi_(e, Application, properties, user);
  var score_open = (Application.getConfigurationValue("CATS Score Open") == "Yes");
  
//  if (Application.getConfigurationValue("CATS Score Open") != "Yes") return ErrorUi_("This application is not currently being scored");
  
  var ProjectName = Application.getResponseValue("ProjectName");
  var Email = Application.getConfigurationValue("Email");
  
  ui.setTitle(ProjectName + " - CATS Scoring");

  var QuestionSheet = new Sheet_(Application.getApplication().getSheetByName("Score"));
  var db = new MemDB_(QuestionSheet.getData());

  var CATSDescriptionQuestions = ui.getElementById("CATSDescriptionQuestions");
  var CATSLogisticsQuestions = ui.getElementById("CATSLogisticsQuestions");
  var CATSTeamQuestions = ui.getElementById("CATSTeamQuestions");
  var CATSSafetyQuestions = ui.getElementById("CATSSafetyQuestions");
  var CATSBudgetQuestions = ui.getElementById("CATSBudgetQuestions");
  var CATSHowBadQuestions = ui.getElementById("CATSHowBadQuestions");
  
  var total_score = 0;
  
  var CoiSection = ui.getElementById("CoiSection");
  CoiSection.setVisible(true);
  CoiSection.clear();

  CoiSection.add(Section_(ui, "CATS Scoring"));

  var coi = db.clearFilters().addFilter({"Question ID":"COI1"}).getData()[0][user.Email];
  if (coi == undefined) coi = "";
  var CoiList = Listbox_(ui, "COI", coi, [
    ["", ""],
    ["No", "NO - I have no conflict of interest and will score this application"],
    ["Yes", "YES - I wish to abstain from scoring this application"]
  ]);

  CoiList.addChangeHandler(ui.createServerHandler("ScoreChangeHandler_")
                               .addCallbackElement(CoiList)
                               .addCallbackElement(ui.createHidden("email", user.Email))
                               .addCallbackElement(ui.createHidden("qid", "COI1"))
                               .addCallbackElement(ui.createHidden("aid", Application.getId()))
                              );
  var CoiQuestion = Question_(ui, CoiList, user.ShortName + ", do you wish to abstain from scoring this application due to a conflict of interest or any other reason?");
  CoiSection.add(Panel_(ui, css.panel, css.indent).add(CoiQuestion));
  
  var sections = ["Description", "Logistics", "Safety", "Team", "Budget"];
  for (var category in sections) {
    var section = sections[category];
    var panel = ui.getElementById("CATS" + section + "Questions");
    if (coi == "No" || !score_open) panel.setVisible(true);
    var Questions = db.clearFilters().addFilter({"Section":section}).getData();
    var QuestionGrid = ui.createGrid(Questions.length, 2)
                         .setId(section + "QuestionGrid")
                         .setBorderWidth(1)
                         .setCellPadding(2)
                         .setCellSpacing(0);
    panel.add(Panel_(ui, css.panel, css.indentedparagraph).add(QuestionGrid));
  
    for (var i = 0; i < Questions.length; i++) {
      
      var ScoreChangeHandler = ui.createServerHandler("ScoreCheckboxChangeHandler_");
      var checked = false;
      if (Questions[i][user.Email] == "1") {
        checked = true;
        total_score++;
      }

      if (score_open) {
        var checkbox = Checkbox_(ui, Questions[i]["Question ID"], checked, ScoreChangeHandler);
        ScoreChangeHandler.addCallbackElement(checkbox);
        ScoreChangeHandler.addCallbackElement(ui.createHidden("email", user.Email));
        ScoreChangeHandler.addCallbackElement(ui.createHidden("qid", Questions[i]["Question ID"]));
        ScoreChangeHandler.addCallbackElement(ui.createHidden("aid", Application.getId()));
        QuestionGrid.setWidget(i, 0, checkbox);
      }
      
      QuestionGrid.setWidget(i, 1, Label_(ui, Questions[i]["Description"], css.budgetdatarow, css.label, css.bold));
      if ((i % 2) == 0) QuestionGrid.setRowStyleAttributes(i, {"background":"pink"});     
      else QuestionGrid.setRowStyleAttributes(i, css.roweven);
      
    }
    
  }
  
  if (score_open) {
  
    var ScoreChangeHandler = ui.createServerHandler("ScoreChangeHandler_");
    ScoreChangeHandler.addCallbackElement(ui.createHidden("email", user.Email));
    ScoreChangeHandler.addCallbackElement(ui.createHidden("qid", "O1"));
    ScoreChangeHandler.addCallbackElement(ui.createHidden("aid", Application.getId()));
    
    var do_you_want_it = db.clearFilters().addFilter({"Question ID":"O1"}).getData()[0][user.Email];
    var comments = db.clearFilters().addFilter({"Question ID":"O2"}).getData()[0][user.Email];
    
    var DesireSection = Section_(ui, "CATS Score Overview").setVisible((coi == "No") ? true : false);
    var Desire = Panel_(ui, css.panel, css.indent);
    var DoYouWantIt = Listbox_(ui, "DoYouWantIt", do_you_want_it, [
      ["", ""],
      ["1", "1 - Not at all"],
      ["2", "2"],
      ["3", "3 - Meh"],
      ["4", "4"],
      ["5", "5 - I totally want this!"]]);
    
    total_score += do_you_want_it;
    var DoYouWantItQuestion = Question_(ui, DoYouWantIt, "How strongly do you feel this project should be funded?");
    Desire.add(DoYouWantItQuestion);
    
    var Comments = TextArea_(ui, "Comments").setText(comments);
    var CommentsQuestion = Question_(ui, Comments, "Comments about the application");
    Desire.add(CommentsQuestion);
    
    ScoreChangeHandler.addCallbackElement(DoYouWantIt);
    ScoreChangeHandler.addCallbackElement(Comments);
    DoYouWantIt.addChangeHandler( ui.createServerHandler("ScoreChangeHandler_")
                                 .addCallbackElement(DoYouWantIt)
                                 .addCallbackElement(ui.createHidden("email", user.Email))
                                 .addCallbackElement(ui.createHidden("qid", "O1"))
                                 .addCallbackElement(ui.createHidden("aid", Application.getId()))
                                );
    Comments.addValueChangeHandler(ui.createServerHandler("ScoreChangeHandler_")
                                 .addCallbackElement(Comments)
                                 .addCallbackElement(ui.createHidden("email", user.Email))
                                 .addCallbackElement(ui.createHidden("qid", "O2"))
                                 .addCallbackElement(ui.createHidden("aid", Application.getId()))
                                );
    var SaveButton = Button_(ui, "SaveButton", "Save comment", ScoreChangeHandler, css.buttonblue, css.buttonbluehover).setEnabled(false).setVisible(false);
    ScoreChangeHandler.addCallbackElement(SaveButton);
    SaveButton.addClickHandler(ui.createClientHandler().forEventSource().setHTML("Saving...").setEnabled(false).setStyleAttributes(css.buttonbluedisabled));
    Desire.add(SaveButton);
    Desire.add(Panel_(ui, css.panel, css.indentedparagraph).add(Label_(ui, user.ShortName + "'s total score: " + total_score + " out of 39", css.label, css.labellarge).setId("ScoreDisplayLabel")));
    
    Comments.addKeyUpHandler(ui.createClientHandler().forTargets(SaveButton).setHTML("Save comment").setEnabled(true).setVisible(true).setStyleAttributes(css.buttonblue));
    ui.getElementById("RobotContent").add(Panel_(ui).add(DesireSection)).add(Desire);

    
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSDescriptionQuestions).validateMatches(CoiList, "No").setVisible(true));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSDescriptionQuestions).validateNotMatches(CoiList, "No").setVisible(false));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSLogisticsQuestions).validateMatches(CoiList, "No").setVisible(true));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSLogisticsQuestions).validateNotMatches(CoiList, "No").setVisible(false));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSTeamQuestions).validateMatches(CoiList, "No").setVisible(true));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSTeamQuestions).validateNotMatches(CoiList, "No").setVisible(false));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSSafetyQuestions).validateMatches(CoiList, "No").setVisible(true));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSSafetyQuestions).validateNotMatches(CoiList, "No").setVisible(false));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSBudgetQuestions).validateMatches(CoiList, "No").setVisible(true));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSBudgetQuestions).validateNotMatches(CoiList, "No").setVisible(false));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSHowBadQuestions).validateMatches(CoiList, "No").setVisible(true));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(CATSHowBadQuestions).validateNotMatches(CoiList, "No").setVisible(false));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(Desire).validateMatches(CoiList, "No").setVisible(true));
    CoiList.addChangeHandler(ui.createClientHandler().forTargets(Desire).validateNotMatches(CoiList, "No").setVisible(false));

  } else {
    // save NOT open
//    CoiList.setSelectedIndex(1);
    CoiSection.setVisible(false);
//    CATSDescriptionQuestions.setVisible(true);
//    CATSLogisticsQuestions.setVisible(true);
//    CATSTeamQuestions.setVisible(true);
//    CATSSafetyQuestions.setVisible(true);
//    CATSBudgetQuestions.setVisible(true);
//    CATSHowBadQuestions.setVisible(true);
   
  }
    
  return ui;

}

function ScoreChangeHandler_(e) { 
  var properties = PropertiesService.getScriptProperties();
  var User = User_();
  var ui = UiApp.getActiveApplication();
  var Application = new Application_(e.parameter.aid);
  
  if (!User.isCat || Application.getConfigurationValue("CATS Score Open") != "Yes") return ui;

  var application = SpreadsheetApp.openById(e.parameter.aid);
  var application_score_sheet = new Sheet_(application.getSheetByName("Score")); 

  var update = {};
  if (e.parameter.qid == "O1") {
    update[e.parameter.email] = e.parameter.DoYouWantIt;
  } else if (e.parameter.qid == "O2") {
    update[e.parameter.email] = e.parameter.Comments;
  } else if (e.parameter.qid == "COI1") {
    update[e.parameter.email] = e.parameter.COI;
  }
  application_score_sheet.updateCell("Question ID", e.parameter.qid, update);
  
  var robot_update = {};
  var robot_score_summary_sheet = new Sheet_(SpreadsheetApp.openById(properties.getProperty("robot_id")).getSheetByName("Scored"));
  var score_data = new MemDB_(application_score_sheet.getData()).clearFilters().addFilter({"Question ID":"SCORE1"}).getData();
  robot_update[e.parameter.email] = score_data[0][e.parameter.email];
//  if (score_data[0][e.parameter.email] <= 0) return ui;
  robot_score_summary_sheet.updateCell("Application ID", e.parameter.aid, robot_update);
  ui.getElementById("ScoreDisplayLabel").setText(User_().ShortName + "'s total score: " + score_data[0][e.parameter.email] + " out of 39");
  ui.getElementById("SaveButton").setText("Saved").setEnabled(false).setVisible(false).setStyleAttributes(css.buttonblue);
  return ui;
}

function ScoreCheckboxChangeHandler_(e) { 
  var properties = PropertiesService.getScriptProperties();
  var User = User_();
  var ui = UiApp.getActiveApplication();
  var Application = new Application_(e.parameter.aid);
  
  if (!User.isCat || Application.getConfigurationValue("CATS Score Open") != "Yes") return ui;

  var application = SpreadsheetApp.openById(e.parameter.aid);
  var application_score_sheet = new Sheet_(application.getSheetByName("Score")); 
  var checked = 0;

  var app_update = {};
  if (e.parameter[e.parameter.qid] == "true") checked = 1;
  app_update[e.parameter.email] = checked;
  application_score_sheet.updateCell("Question ID", e.parameter.qid, app_update);

  var robot_update = {};
  var robot_score_summary_sheet = new Sheet_(SpreadsheetApp.openById(properties.getProperty("robot_id")).getSheetByName("Scored"));
  var score_data = new MemDB_(application_score_sheet.getData()).clearFilters().addFilter({"Question ID":"SCORE1"}).getData();
  robot_update[e.parameter.email] = score_data[0][e.parameter.email];
//  if (score_data[0][e.parameter.email] <= 0) robot_update[e.parameter.email] = "No Vote";

  robot_score_summary_sheet.updateCell("Application ID", e.parameter.aid, robot_update);

  ui.getElementById("ScoreDisplayLabel").setText(User.ShortName + "'s total score: " + score_data[0][e.parameter.email] + " out of 39");

  return ui;
}

function Currency_(n) {
  if (n == undefined) throw new Error("Currency_() requires a number as input.  You gave me: '" + n + "'");
  n += '';
  x = n.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  var r = /(\d+)(\d{3})/;
  while (r.test(x1)) {
    x1 = x1.replace(r, '$1' + ',' + '$2');
  }
  x2 = Number(x2).toFixed(2);
  return '$' + x1 + x2.substr(1);
}

function FormatDate_(date_string) {
  return Utilities.formatDate(new Date(date_string), Session.getScriptTimeZone(), "MMMM d, y");
}

function FormatExactDate_(date_string) {
  return Utilities.formatDate(new Date(date_string), Session.getScriptTimeZone(), "EEEE, MMMM d, y 'at' h:mma', Mountain time'");
}

function Trim_(stringToTrim) {
  if (typeof stringToTrim == 'string') return stringToTrim.replace(/^\s+|\s+$/g, "");
  else return stringToTrim;
}

function Urlify_(ui, input) {
  if (ui == undefined) throw new Error("Urlify_() requires a ui object");
  if (input == undefined) input = "";
  input = String(input);
  var applyStyles = function(widget, styles) {
    var length = styles.length;
    for (var i = 0; i < length; i++) {
      widget.setStyleAttributes(styles[i]);
    }
  }
  
  var OutputPanel = Panel_(ui);
  var lines = input.split(/\r\n+|\r+|\n+/g);

  var options = {
    textStyles: [css.label],
    anchorStyles: [css.label]
  };
  
  var arguments_length = arguments.length;
  for (var i = 2; i < arguments_length; i++) {
    options["textStyles"].push(arguments[i]); 
    options["anchorStyles"].push(arguments[i]); 
  }
  
  options["anchorStyles"].push(css.anchor);
//  options["anchorStyles"].push(css.urlifyanchor);
  options["textStyles"].push(css.inline);
//  options["textStyles"].push(css.urlifytext);
//  options["paragraphStyles"].push(css.urlifyparagraph);
  
  var line_length = lines.length;
    
  for (var i = 0; i < line_length; i++) {
    var ParagraphPanel = ui.createFlowPanel().setStyleAttributes(css.panel);
    if (i + 1 < line_length) ParagraphPanel.setStyleAttributes(css.shimbottom);
    var words = lines[i].split(/\s+/g);
    var text = "";
    var words_length = words.length;
    
    for (var w = 0; w < words_length; w++) {
      
      var word = words[w];
      
      if (word.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)) {
        
        // email address
                     
        if (text != "") {
          var previous_text = HTML_(ui, text);
          applyStyles(previous_text, options["textStyles"]);
          ParagraphPanel.add(previous_text);
        }
    
        var anchor = Anchor_(ui, word, "mailto:" + word);
        applyStyles(anchor, options["anchorStyles"]);
        
        var space = ui.createInlineLabel(" ");
        applyStyles(space, options["textStyles"]);
        ParagraphPanel.add(space).add(anchor);
        text = "";

      } else if (word.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/)) {
        
        // "normal" url
        if (text != "") {
          var previous_text = HTML_(ui, text);
          applyStyles(previous_text, options["textStyles"]);
          ParagraphPanel.add(previous_text);
        }
        
        var shortword = word;
        if (shortword.length > 50) shortword = shortword.substr(0, 50) + "...";

        if (!word.match(/^https?:\/\//)) word = 'http://' + word;
        
        var anchor = Anchor_(ui, shortword, word);
        applyStyles(anchor, options["anchorStyles"]);

        var space = ui.createInlineLabel(" ");
        applyStyles(space, options["textStyles"]);

        ParagraphPanel.add(space).add(anchor);
        text = "";
        
      } else {
      
        // regular word
        text += " ";
        text += word;      
      }
  
    }
  
    if (text != "") {
      var trailer_text = HTML_(ui, text);
      applyStyles(trailer_text, options["textStyles"]);
      ParagraphPanel.add(trailer_text);
    }
    
    OutputPanel.add(ParagraphPanel);
  }
    
  return OutputPanel;

}

function CatsMascotUrl_(properties) {
  return DriveImgUrl_(properties.getProperty("mascot_id")); 
}
function ApoLogoUrl_(properties) {
  return DriveImgUrl_(properties.getProperty("apo_logo_id")); 
}

function CatsLogoUrl_(properties) {
  return DriveImgUrl_(properties.getProperty("cats_logo_id")); 
}

function ApplicationUrl_(app_id, properties) {
  if (app_id == undefined || app_id == "" ) app_id = "begin";
  return properties.getProperty("script_url") + "?application=" + app_id;
}

function EditUrl_(app_id, edit_token, properties) {
  return properties.getProperty("script_url") + "?application=" + app_id + "&edit=" + edit_token;
}

function ShortUrl_(longUrl) {
  var newLongUrl = UrlShortener.newUrl().setLongUrl(longUrl);
  var shortUrl = UrlShortener.Url.insert(newLongUrl);
  return shortUrl.getId();
}

function DriveImgUrl_(file_id) {
  return "https://drive.google.com/uc?export=download&id=" + file_id; 
}

function UUID_() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

function Stopwatch_(new_watch_name) {
  
  var start_time = new Date();
  var lap_time = new Date();
  var watch_name = (new_watch_name == undefined) ? "STOPWATCH" : new_watch_name;
  
  this.lap = function(label) {
    var new_time = new Date();
    var elapsed = new Number((new_time.getTime() - lap_time.getTime()) / 1000).toFixed(2);
    if (label == undefined) label = "";
    lap_time = new_time;
    Logger.log(watch_name + "[" + label + "]: " + elapsed.toString() + "s");
    return elapsed;
  }
  
  this.elapsed = function() {
    var new_time = new Date();
    var elapsed = new Number((new_time.getTime() - start_time.getTime()) / 1000).toFixed(2);
    Logger.log(watch_name + " ELAPSED: " + elapsed.toString() + "s");
    return elapsed;
  }
  
  this.reset = function() { 
    start_time = new Date();
    lap_time = new Date();
  }
  
}

Stopwatch_.prototype = { constructor: Stopwatch_ }

function User_(can_edit) {
  
  var edit = false;
  if (can_edit != undefined) edit = Boolean(can_edit);
  
  var user = {
    loadedEmail: "",
    isIgnition: false,
    isCat: false,
    isAdmin: false,
    isEditor: can_edit,
    LegalName: "",
    ShortName: "",
    Email: "",
    Phone: ""
  };
  
  var email = new String(Session.getActiveUser().getEmail()).toLowerCase();
  user.loadedEmail = email;
  if (email == undefined || email == "" || email == "undefined") return user;

  user.isIgnition = true;
  
  var data = GetCATS_();  
  var cats = new MemDB_(data).addFilter({"Email":email}).getData();
  if (cats.length != 1) return user;

  user.isCat = true;
  user.LegalName = cats[0]["Legal Name"];
  user.ShortName = cats[0]["Short Name"];
  user.Email = cats[0]["Email"];
  user.Phone = cats[0]["Phone"];
  user.isAdmin = (cats[0]["Admin"] == "Yes" ? true : false);

  return user;
  
}

function daysBetween( date1, date2 ) {
  //Get 1 day in milliseconds
  var one_day=1000*60*60*24;

  // Convert both dates to milliseconds
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;
    
  // Convert back to days and return
  return Math.round(difference_ms/one_day); 
}


function LoadCATS() {
  var properties = PropertiesService.getScriptProperties();
  var sheet = new Sheet_(SpreadsheetApp.openById(properties.getProperty("robot_id")).getSheetByName("CATS"));
  var cache_key = "CATS";
  properties.setProperty(cache_key, JSON.stringify(sheet.getData())); 
}

function GetCATS_() {
  var properties = PropertiesService.getScriptProperties();
  var cache_key = "CATS";
  var data = properties.getProperty(cache_key);
  if (data == null) {
    var cats_sheet = new Sheet_(SpreadsheetApp.openById(properties.getProperty("robot_id")).getSheetByName("CATS"));
    data = cats_sheet.getData();
    properties.setProperty(cache_key, JSON.stringify(data)); 
  } else {
    data = JSON.parse(data);      
  }
  
  return data;  
}

function ScaleImage_(width, height, max_width) {
  var vector = {};
  vector["width"] = max_width;
  vector["height"] = (max_width * height) / height; 
  return vector;  
}

function UpdateConfig() {
  var properties = PropertiesService.getScriptProperties();
  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
  var sheet  = robot.getSheetByName("Configuration");
  var data = new Sheet_(sheet).getData();
  var new_properties = {};
  for (var i = 0; i < data.length; i++) {
    var key = data[i]["Key"];
    var value = data[i]["Value"];
    new_properties[key] = value;
  }
  properties.setProperties(new_properties, true);
}

function UpdateMenu() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Robot")
  .addItem("Sync", "SyncApplication_")
  .addSubMenu(ui.createMenu("Actions")
                  .addItem("Sync all applications", "SyncAllApplications")
                  .addItem("Check for new applications", "CreateNewApplications")
                  .addItem("Update question counts", "UpdateQuestionCounts")
                  .addItem("Send question notifications", "SendQuestionNotifications")
             )
  .addSubMenu(ui.createMenu("Application")
                  .addItem("Sync", "SyncApplication_")
                  .addItem("CATS View", "ToggleCATSView_")
                  .addItem("Edit Open", "ToggleEditOpen_")
                  .addItem("QnA", "ToggleQnAOpen_")
                  .addItem("Score", "ToggleScoreOpen_")
                  .addItem("Application Final", "ToggleApplicationFinal_")
             )
//  .addSeparator()
  .addSubMenu(ui.createMenu("Status")
              .addItem("New", "SetNewStatus_")
              .addItem("Review", "SetReviewStatus_")
              .addItem("Decline", "SetDeclineStatus_")
              .addItem("Vote", "SetVoteStatus_")
              .addItem("Fund", "SetFundStatus_")
              .addItem("Withdraw", "SetWithdrawStatus_")
              )
  .addSubMenu(ui.createMenu("Admin")
              .addItem("Reload Config", "UpdateConfig")
              .addItem("Load Quotes", "LoadQuotes")
              )
  .addToUi();
}

function onOpen() {
  UpdateMenu();
}

function onInstall() {
  InitialSetup();
  UpdateConfig();
  onOpen();
}

function Quote_() {
  var properties = PropertiesService.getScriptProperties();
  var cached = properties.getProperty("quotes");
  var quotes = [];
  if (cached == null) {
    var quotes_sheet = new Sheet_(SpreadsheetApp.openById(properties.getProperty("robot_id")).getSheetByName("Quotes"));
    quotes = quotes_sheet.getData();
    properties.setProperty("quotes", JSON.stringify(quotes));     
  } else {
    quotes = JSON.parse(cached);
  }
  var index = (Math.floor(Math.random() * quotes.length));
  if (index < 0 || index >= quotes.length) index = 0;
  var quote = quotes[index];
  return quote;
}

function DashboardUi_(e, properties, User) {
 
  if (!User.isIgnition) return ErrorUi_("For some reason Google doesn't think you're logged in to your Ignition account.  " + 
                                        "If you're logged in to any other Google accounts, try logging out of those and only " + 
                                        "logging in to your Ignition account.  What you should really do is start using this " + 
                                        "method to manage multiple user accounts in Chrome.  If you don't use Chrome, try opening " + 
                                        "a \"private browsing\" type window and log in there. ");
  if (!User.isCat) return ErrorUi_("Only registered members of CATS may view this page.  If you're logged in to any other Google " + 
                                   "accounts, try logging out of those and only logging in to your Ignition account.");
  
  var ui = Ui_(properties, properties.getProperty("round_name") + " Dashboard");
  var Robot = new Robot_();

  var Content = Content_(ui);
  ui.add(Content);

  Content.add(Header_(ui, properties, "Welcome to the " + properties.getProperty("round_name") + " dashboard thingy, " + User.ShortName + "!!"));

  var QueryHPanel = HPanel_(ui);
  QueryHPanel.add(Label_(ui, "Sort applications by: ", css.label, css.bold));
  var SortList = [
    ["Project Name"],
    ["Project Lead"],
    ["Category"],
    ["Rating"],
    ["Requested Amount"],
    ["Viewed?"],
    ["Questions"],
    ["Responses"],
    ["Should Fund"],
    ["Your Score"],
    ["Score"],
    ["Granted Amount"]
  ];
  var Sort = Listbox_(ui, "Sort", Robot.getUserSortField(), SortList);
  var OrderList = [
    ["A-Z"],
    ["Z-A"]
  ];
  var Order = Listbox_(ui, "Order", (Robot.getUserSortDirection() ? "Z-A" : "A-Z"), OrderList);
    
  var SortButtonClickHandler = ui.createServerHandler("SortButtonClickHandler_")
                                  .addCallbackElement(Sort)
                                  .addCallbackElement(Order);
  
  var SortButton = Button_(ui, "SortButton", "Sort", SortButtonClickHandler, css.buttonblue, css.buttonbluehover);
  SortButton.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setText("Sorting that shit up...").setStyleAttributes(css.buttonbluedisabled));
  SortButtonClickHandler.addCallbackElement(SortButton);
  QueryHPanel.add(Sort).add(Order).add(SortButton);
  Content.add(QueryHPanel);
  
  var applications_grid = ui.createGrid(1, 10)
                         .setId("AppGrid")
                         .setBorderWidth(1)
                         .setCellPadding(2)
                         .setCellSpacing(0)
                         .setTitle("")
                         .setStyleAttributes(css.fullwidth);
  
  Content.add(applications_grid);
  
  Dashboard_(ui);
  
  Content.add(Spacer_(ui));
  
  return ui;
}

function SortButtonClickHandler_(e) {
  var ui = UiApp.getActiveApplication();
  var Robot = new Robot_();
  Robot.setUserSortField(e.parameter.Sort);
  Robot.setUserSortDirection(e.parameter.Order);
  Dashboard_(ui);
  ui.getElementById("SortButton").setEnabled(true).setText("Sort").setStyleAttributes(css.buttonblue);
  return ui;
}

function Dashboard_(ui) {
  
  var Robot = new Robot_();
  var DashboardDb = Robot.getDashboardDb();
  var sort = Robot.getUserSortField();
  var order = Robot.getUserSortDirection();
  var properties = PropertiesService.getScriptProperties();

  DashboardDb.sortData(sort, order);
  if (
    sort == "Requested Amount" || 
    sort == "Granted Amount" || 
    sort == "Viewed?" || 
    sort == "Questions" || 
    sort == "Responses" || 
    sort == "Should Fund" || 
    sort == "Your Score" || 
    sort == "Score") {
    DashboardDb.sortData(sort, false);
    DashboardDb.sortNumberData(sort, order);
  } else {
    DashboardDb.sortData(sort, order);
  }
    
  var Applications = DashboardDb.getData();
  var applications_grid = ui.getElementById("AppGrid");
  applications_grid.clear();
  var fields = Robot.getDashboardColumns();
  var number_of_columns = fields.length;
  
  applications_grid.resize(1 + Applications.length, number_of_columns);
  for (var i = 0; i < number_of_columns; i++) {
    applications_grid.setWidget(0, i, Label_(ui, fields[i], css.dashboardheadercell));
  }
  applications_grid.setRowStyleAttributes(0, css.budgetdatagridheader);

  var rownum = 1;
  var hide_score = false;
  if (properties.getProperty("dashboard_hide_score") == "Yes") hide_score = true;

  for (var row = 0; row < Applications.length; row++) {
    Logger.log(JSON.stringify(Applications[row]));
    var app_id = Applications[row]["Application ID"];
    
//    if (app_id == "") continue;
    var score = (isNaN(Number(Applications[row]["Your Score"])) || Number(Applications[row]["Your Score"]) <= 0) ? "Not Scored" : Number(Applications[row]["Your Score"]).toFixed(0).toString();
    var cats_score = (isNaN(Number(Applications[row]["Score"])) || Number(Applications[row]["Score"]) < 0 || Applications[row]["Application Final"] == "No") ? "Pending" : Number(Applications[row]["Score"]).toFixed(3).toString();
    var viewed = (isNaN(Number(Applications[row]["Viewed?"])) || Number(Applications[row]["Viewed?"]) <= 0) ? "No" : "Yes";
    var should_fund = (isNaN(Number(Applications[row]["Should Fund"])) || Number(Applications[row]["Should Fund"]) < 1) ? "N/A" : Number(Applications[row]["Should Fund"]).toFixed(0).toString();
    var questions = Number(Applications[row]["Questions"]);
    var responses = Number(Applications[row]["Responses"]);
    var requested_amount = Label_(ui, (isNaN(Number(Applications[row]["Requested Amount"])) || Applications[row]["Requested Amount"] == "") ? "None" : Currency_(Applications[row]["Requested Amount"]));
    var granted_amount = Label_(ui, (isNaN(Number(Applications[row]["Granted Amount"])) || Applications[row]["Granted Amount"] == "") ? "None" : Currency_(Applications[row]["Granted Amount"]));
    if (hide_score) score = "";
//UiApp.createApplication().createGrid().setStyleAttributes(row, column, attributes)

    var url = Applications[row]["Application Url"];
    
    if (Applications[row]["CATS Score Open"] == "Yes") {
      applications_grid.setWidget(rownum, fields.indexOf("Your Score"), Anchor_(ui, score, url, css.label, css.bold));
    } else { 
      applications_grid.setWidget(rownum, fields.indexOf("Your Score"), Label_(ui, score, css.label, css.bold));
    }

    //    if (Applications[row]["Application Final"] == "Yes") {
//      applications_grid.setWidget(rownum, fields.indexOf("Score"), Label_(ui, cats_score, css.label, css.bold))
//    } else {
//      applications_grid.setWidget(rownum, fields.indexOf("Score"), Label_(ui, cats_score, css.label, css.bold))
//    }

    applications_grid
//      .setWidget(rownum, fields.indexOf("Project Name"), Panel_(ui, css.dashboardcell).add(Anchor_(ui, Applications[row]["Project Name"], Applications[row]["Application Url"], css.label, css.bold)))
      .setWidget(rownum, fields.indexOf("Project Name"), Panel_(ui, css.dashboardcell).add(Anchor_(ui, Applications[row]["Project Name"], url, css.label, css.bold)))
      .setWidget(rownum, fields.indexOf("Project Lead"), Panel_(ui, css.dashboardcell).add(Label_(ui, Applications[row]["Project Lead"]).setWordWrap(true)))
      .setWidget(rownum, fields.indexOf("Rating"), Label_(ui, Applications[row]["Rating"]))
      .setWidget(rownum, fields.indexOf("Category"), Panel_(ui, css.dashboardcell).add(Label_(ui, Applications[row]["Category"])))
      .setWidget(rownum, fields.indexOf("Requested Amount"), requested_amount)
      .setWidget(rownum, fields.indexOf("Granted Amount"), granted_amount)
      .setWidget(rownum, fields.indexOf("Should Fund"), Label_(ui, should_fund))
//      .setWidget(rownum, fields.indexOf("Your Score"), Label_(ui, score))
      .setWidget(rownum, fields.indexOf("Score"), Label_(ui, cats_score))
      .setWidget(rownum, fields.indexOf("Viewed?"), Label_(ui, viewed))
      .setWidget(rownum, fields.indexOf("Questions"), Label_(ui, questions))
      .setWidget(rownum, fields.indexOf("Responses"), Label_(ui, responses))
      .setStyleAttributes(rownum, fields.indexOf("Requested Amount"), {textAlign: "right", paddingRight:"10px"})
      .setStyleAttributes(rownum, fields.indexOf("Granted Amount"), {textAlign: "right", paddingRight:"10px"})
      .setStyleAttributes(rownum, fields.indexOf("Should Fund"), {textAlign: "center"})
      .setStyleAttributes(rownum, fields.indexOf("Your Score"), {textAlign: "center"})
      .setStyleAttributes(rownum, fields.indexOf("Score"), {textAlign: "center"})
      .setStyleAttributes(rownum, fields.indexOf("Viewed?"), {textAlign: "center"})
      .setStyleAttributes(rownum, fields.indexOf("Questions"), {textAlign: "center"})
      .setStyleAttributes(rownum, fields.indexOf("Responses"), {textAlign: "center"})
      .setStyleAttributes(rownum, fields.indexOf("Rating"), {textAlign: "center"})
    ;

    
    if (rownum % 2 == 1) applications_grid.setRowStyleAttributes(rownum, css.rowodd);
    else applications_grid.setRowStyleAttributes(rownum, css.roweven);

    if (viewed == "No") applications_grid.setStyleAttributes(rownum, fields.indexOf("Viewed?"), css.rowhilite);

    
    rownum++;

  }
  return ui;
}

function FixPermissions() {
  var properties = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(properties.getProperty("robot_id"));
  var Sheet = new Sheet_(ss.getSheetByName("Applications")).cacheOff();
//  Sheet.getColumns(true);
  var Db = new MemDB_(Sheet.getData());
  var data = Db.addExclude({"Granted Amount":""}).addFilter({"Fixed":""}).getData();

  Logger.log("FOUND: " + data.length);
  
  for (var i = 0; i < data.length; i++) {
   
    var row = data[i];
    
    Logger.log(row["Project Name"]);
    
//    continue;
  
    var Application = new Application_(row["Application ID"]);

    Drive.Permissions.insert(
      {
        'role': 'writer',
        'type': 'group',
        'value': 'grants@apogaea.com'
      },
        Application.getConfigurationValue("Application Directory ID"),
      {
        'sendNotificationEmails': 'false'
      }
    );
  
    Drive.Permissions.insert(
      {
        'role': 'writer',
        'type': 'group',
        'value': 'grants@apogaea.com'
      },
        Application.getConfigurationValue("Signed Documents Directory ID"),
      {
        'sendNotificationEmails': 'false'
      }
    );
  
    Drive.Permissions.insert(
      {
        'role': 'writer',
        'type': 'group',
        'value': 'grants@apogaea.com'
      },
        Application.getConfigurationValue("Photo Documentation Directory ID"),
      {
        'sendNotificationEmails': 'false'
      }
    );
    
    Sheet.updateCell("Application ID", row["Application ID"], {"Fixed":"Yes"});
//    return;
//    if (i > 1) return;
  
  }

}

function CreateNewApplications() {
  Logger.log("CreateNewApplications(): START");

  var properties = PropertiesService.getScriptProperties();
  
  if (properties.getProperty("accepting_applications") != "Yes") {
    Logger.log("CreateNewApplications(): accepting_applications != 'Yes'"); 
    return;
  }
  
  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
  var sheet = new Sheet_(robot.getSheetByName("New"));
  var db = new MemDB_(sheet.getData());
  var data = db.addExclude({"Email":""}).addFilter({"Application ID":""}).getData();
  
  Logger.log("CreateNewApplications(): Found " + data.length + " new emails");
  
  for (var i = 0; i < data.length; i++) {
    try {
      var application = Application_.createApplication(data[i]["Email"]);
      Logger.log("CreateNewApplications(): Created application: " + data[i]["Email"] + " : " + application.getId());
    } catch (err) {
      Logger.log("CreateNewApplications(): Error creating application: " + err.toString());
    }
  }

  Logger.log("CreateNewApplications(): DONE");
}

function SyncAllApplications() {
  var properties = PropertiesService.getScriptProperties();
  var Robot = new Robot_();
  var sheet = Robot.getDashboardSheet();
  var db = Robot.getApplicationsDb();
  var applications = db.addFilter({"Status":"Review"}).getData();
  var applications_length = applications.length;
  Logger.log("SyncAllApplications(): applications to sync: " + applications_length);
  
  for (var i = 0; i < applications_length; i++) {
    try {
      var app = new Application_(applications[i]["Application ID"]);
      Robot.syncApplication(app);
    } catch (err) {
      Logger.log("SyncAllApplications(): " + err.toString());   
    }
  }
}

function SyncApplication_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var active_sheet = ss.getActiveSheet();
  if (RequireSheet_(active_sheet, "Applications") == false) return;
  var range = SelectedRowsRange_(ss);
  var data = range.getValues();
  var Robot = new Robot_();
  var sheet = new Sheet_(active_sheet);
  var cols = sheet.getColumns();
  for (var i = 0; i < data.length; i++) {
    var app = new Application_(data[i][cols.indexOf("Application ID")]);
    Robot.syncApplication(app);
  }
}

function SetReviewStatus_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var active_sheet = ss.getActiveSheet();
  if (RequireSheet_(active_sheet, "Applications") == false) return;
  var range = SelectedRowsRange_(ss);
  var data = range.getValues();
  var Robot = new Robot_();
  var sheet = new Sheet_(active_sheet);
  var cols = sheet.getColumns();
  for (var i = 0; i < data.length; i++) {
    var app = new Application_(data[i][cols.indexOf("Application ID")]);
    app.setConfigurationValue("Status", "Review");
    app.setConfigurationValue("CATS View", "Yes");
    app.setConfigurationValue("CATS QnA Open", "Yes");
    app.setConfigurationValue("Edit Open", "Yes");
    Robot.syncApplication(app);
  }
}

function SetWithdrawStatus_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var active_sheet = ss.getActiveSheet();
  if (RequireSheet_(active_sheet, "Applications") == false) return;
  var range = SelectedRowsRange_(ss);
  var data = range.getValues();
  var Robot = new Robot_();
  var sheet = new Sheet_(active_sheet);
  var cols = sheet.getColumns();
  for (var i = 0; i < data.length; i++) {
    var app = new Application_(data[i][cols.indexOf("Application ID")]);
    app.setConfigurationValue("Status", "Withdraw");
    app.setConfigurationValue("CATS View", "No");
    app.setConfigurationValue("CATS QnA Open", "No");
    app.setConfigurationValue("Edit Open", "No");
    Robot.syncApplication(app);
  }
}

function SetDeclineStatus_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var active_sheet = ss.getActiveSheet();
  if (RequireSheet_(active_sheet, "Applications") == false) return;
  var range = SelectedRowsRange_(ss);
  var data = range.getValues();
  var Robot = new Robot_();
  var sheet = new Sheet_(active_sheet);
  var cols = sheet.getColumns();
  for (var i = 0; i < data.length; i++) {
    var app = new Application_(data[i][cols.indexOf("Application ID")]);
    app.setConfigurationValue("Status", "Decline");
    app.setConfigurationValue("CATS View", "Yes");
    app.setConfigurationValue("CATS QnA Open", "No");
    app.setConfigurationValue("Edit Open", "No");
    app.setConfigurationValue("Application Final", "Yes");
    Robot.syncApplication(app);
  }
}

function ToggleCATSView_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var active_sheet = ss.getActiveSheet();
  if (RequireSheet_(active_sheet, "Applications") == false) return;
  var range = SelectedRowsRange_(ss);
  var data = range.getValues();
  var Robot = new Robot_();
  var sheet = new Sheet_(active_sheet);
  var cols = sheet.getColumns();
  for (var i = 0; i < data.length; i++) {
    var app = new Application_(data[i][cols.indexOf("Application ID")]);
    
    if (app.getConfigurationValue("CATS View") == "Yes") app.setConfigurationValue("CATS View", "No");
    else app.setConfigurationValue("CATS View", "Yes");

    Robot.syncApplication(app);
  }
}

function ToggleEditOpen_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var active_sheet = ss.getActiveSheet();
  if (RequireSheet_(active_sheet, "Applications") == false) return;
  var range = SelectedRowsRange_(ss);
  var data = range.getValues();
  var Robot = new Robot_();
  var sheet = new Sheet_(active_sheet);
  var cols = sheet.getColumns();
  for (var i = 0; i < data.length; i++) {
    var app = new Application_(data[i][cols.indexOf("Application ID")]);
    
    if (app.getConfigurationValue("Edit Open") == "Yes") app.setConfigurationValue("Edit Open", "No");
    else app.setConfigurationValue("Edit Open", "Yes");

    Robot.syncApplication(app);
  }
}

function ToggleQnAOpen_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var active_sheet = ss.getActiveSheet();
  if (RequireSheet_(active_sheet, "Applications") == false) return;
  var range = SelectedRowsRange_(ss);
  var data = range.getValues();
  var Robot = new Robot_();
  var sheet = new Sheet_(active_sheet);
  var cols = sheet.getColumns();
  for (var i = 0; i < data.length; i++) {
    var app = new Application_(data[i][cols.indexOf("Application ID")]);
    
    if (app.getConfigurationValue("CATS QnA Open") == "Yes") app.setConfigurationValue("CATS QnA Open", "No");
    else app.setConfigurationValue("CATS QnA Open", "Yes");

    Robot.syncApplication(app);
  }
}

function ToggleScoreOpen_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var active_sheet = ss.getActiveSheet();
  if (RequireSheet_(active_sheet, "Applications") == false) return;
  var range = SelectedRowsRange_(ss);
  var data = range.getValues();
  var Robot = new Robot_();
  var sheet = new Sheet_(active_sheet);
  var cols = sheet.getColumns();
  for (var i = 0; i < data.length; i++) {
    var app = new Application_(data[i][cols.indexOf("Application ID")]);
    
    if (app.getConfigurationValue("CATS Score Open") == "Yes") app.setConfigurationValue("CATS Score Open", "No");
    else app.setConfigurationValue("CATS Score Open", "Yes");

    Robot.syncApplication(app);
  }
}

function ToggleApplicationFinal_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var active_sheet = ss.getActiveSheet();
  if (RequireSheet_(active_sheet, "Applications") == false) return;
  var range = SelectedRowsRange_(ss);
  var data = range.getValues();
  var Robot = new Robot_();
  var sheet = new Sheet_(active_sheet);
  var cols = sheet.getColumns();
  for (var i = 0; i < data.length; i++) {
    var app = new Application_(data[i][cols.indexOf("Application ID")]);
    
    if (app.getConfigurationValue("Application Final") == "Yes") app.setConfigurationValue("Application Final", "No");
    else app.setConfigurationValue("Application Final", "Yes");

    Robot.syncApplication(app);
  }
}

function SendDecline() {

  var properties = PropertiesService.getScriptProperties();
  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
  var ApplicationsSheet = new Sheet_(robot.getSheetByName("Applications")).cacheOff();
  var Applications = new MemDB_(ApplicationsSheet.getData())
                          .addFilter({Status:"Decline", "Decision Email Date":""})
                          .getData();
  
  for (var i = 0; i < Applications.length; i++) {
//    Logger.log("appid:" + Applications[i]["Application ID"]);
    var Application = new Application_(Applications[i]["Application ID"]);

    var url = Application.getConfigurationValue("Edit Url");

//<p><?= ProjectLeadShortName; ?>,</p>
// 
//<p>This year, the Apogaea Art Committee received fourteen applications for the 
//Cross-pollination Round asking for almost two times the amount of money available in the 
//round.   Unfortunately, this means we had to deny many good requests.  I am sorry 
//to say that your project, <?= ProjectName; ?>, was not selected to receive funding.</p>
//
//<p>Scoring results are available for review: <?= ApplicationUrl; ?></p>
//
//<p>You are encouraged to communicate with your liaison, <?= LiaisonName; ?>, by emailing 
//<?= LiaisonEmail; ?> to discuss what your score means and whether your application might 
//be a good fit for another round of grant funding.</p>
//
//<p>Thank you for taking the time to submit an Apogaea grant application.  It is creative 
//people like you that make Apogaea something special.</p>
//  
//<p>Sincerely,</p>
// 
//<p>James Whiddon</p>


    var html = "<p>Dear " + Application.getResponseValue("AlternateName") + ",</p>";

     html += "<p>This year, CATS received forty-six applications for the " +
              "Seed Money Round asking for almost one and a half times the amount of money available in the  " +
              "round.   Unfortunately, this means we had to deny many good requests.  I am sorry  " +
              "to say that your project, " + Application.getResponseValue("ProjectName") + ", was not selected to receive funding." + 
              "</p>"; 
    
    html += "<p><b>Your score details and comments from CATS are in your application: " + url + "</b></p>";

    html += "<p>If you have questions about what your score means, email " + properties.getProperty("help_email") + ".</p>";

    html += "<p>Thank you for taking the time to submit an Apogaea grant application.  " + 
            "We truly hope you are able to find a way to bring your amazing idea to Apogaea despite not receiving a grant this year.  " + 
            "It is creative people like you that make Apogaea something special.</p>";
    
    html += "<p>Love,</p>" + 
            "<p>" + properties.getProperty("robot_email_name") + "</p>";
    
    var t = HtmlService.createTemplate(html);
    var email_body = t.evaluate().getContent();
    
    MailApp.sendEmail({
      to: "grandpa@apogaea.com",
//       to: Application.getConfigurationValue("Email"),
      bcc: properties.getProperty("script_owner_email"),
      name: properties.getProperty("robot_email_name"),
      replyTo: properties.getProperty("help_email"),
      subject: "Thank you for submitting an Apogaea grant application",
      htmlBody: email_body
    });

    ApplicationsSheet.updateRow("Application ID", Applications[i]["Application ID"], {"Decision Email Date": new Date()});
    
  }
  
}

//function SendViewNagEmail() {
//
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//  var CATSSheet = new Sheet_(robot.getSheetByName("CATS")).cacheOff();
//  var CATS = CATSSheet.getData();
//  
//  for (var i = 0; i < CATS.length; i++) {
//
//    var cat = CATS[i]["Email"];
//    var name = CATS[i]["Short Name"];
//    var apps_viewed = CATS[i]["Apps Viewed"];
//    var total_apps = CATS[i]["Total Apps"];
//    var apps_left = CATS[i]["Apps Left"];
//    var group_average = CATS[i]["Group Average"];
//    var days_left = CATS[i]["Days Left"];
//    var average_per_day_to_finish = CATS[i]["Average per Day to Finish"];
//    
//    var minutes_of_work = 5 * Number(apps_left);
//    var hours_of_work = minutes_of_work / 60;
//    var how_much_work = minutes_of_work.toFixed(0).toString() + " minutes";
//    if (minutes_of_work > 60) how_much_work = hours_of_work.toFixed(1).toString() + " hours";
//    
//    if (Number(apps_viewed) >= Number(group_average)) continue; 
//    
//    //You have read 5 of 35 applications (group average is 15).  You have 15 days to read the remaining 30 applications (need to read an average of 2 per day). 
//    
//    var html = "<p>Dearest " + name + ",</p>";
//
//     html += "<p>The Grant Robot thinks you have read " + apps_viewed + " of " + total_apps + " applications (group average is " + Number(group_average).toFixed(1).toString() + ").  " + 
//       "There " + ((Math.abs(days_left) != 1) ? "is " : "are ") + days_left + " day" + ((Math.abs(days_left) != 1) ? "s" : "") + " to read the remaining " + apps_left + " applications (need to read an average of " + Number(average_per_day_to_finish).toFixed(1).toString() + " per day to finish on time).  " + 
//                   "If you spend an average of 5 minutes on each unviewed application, it will take at least " + how_much_work + " to get through them." + 
//                   "</p>"; 
//
//    html += "<p><b>It is important to be logged in to your Ignition account when you are viewing the applications.  If you aren't logged in, a gigantic message will appear at the top of the application you are viewing.  " +
//      "If you see that, you aren't logged in and you aren't getting credit for viewing the application.  If your views aren't showing up in the dashboard: either you aren't logged in, or something is wrong.  " + 
//      "Email " + properties.getProperty("help_email") + " if something weird is happening. </b></p>";
//
//    
//    html += "<p><b>Seed Round Dashboard: " + properties.getProperty("dashboard_url") + "</b></p>";
//    html += "<p>Q&A opens on " + FormatDate_(properties.getProperty("cats_review_begin_date")) + " on or shortly after 12:01am.  You must view all applications by " + FormatDate_(properties.getProperty("cats_review_end_date")) + ".</p>";
//    
//    html += "<p>Love,</p>" + 
//            "<p>" + properties.getProperty("robot_email_name") + "</p>";
//    
//    var t = HtmlService.createTemplate(html);
//    var email_body = t.evaluate().getContent();
//    
//    MailApp.sendEmail({
////      to: "grandpa@apogaea.com",
//       to: cat,
//       bcc: properties.getProperty("script_owner_email"),
//      name: properties.getProperty("robot_email_name"),
//      replyTo: properties.getProperty("help_email"),
//      subject: "Seed Money Round reminder",
//      htmlBody: email_body
//    });
//
//    //    UpdateRow_(ApplicationsSheet, "Application ID", Applications[i]["Application ID"], "Decision Email Date", new Date());
//    
//  }
//  
//}

//function SendScoreNagEmail() {
//
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//  var CATSSheet = new Sheet_(robot.getSheetByName("CATS")).cacheOff();
//  var CATS = CATSSheet.getData();
//  
//  for (var i = 0; i < CATS.length; i++) {
//
//    var cat = CATS[i]["Email"];
//    var name = CATS[i]["Short Name"];
//    var apps_viewed = CATS[i]["Apps Scored"];
//    var total_apps = CATS[i]["Total Apps"];
//    var apps_left = CATS[i]["Apps to Score"];
//    var group_average = CATS[i]["Group Scored Average"];
//    var days_left = CATS[i]["Score Days Left"];
//    var average_per_day_to_finish = CATS[i]["Average Scored per Day to Finish"];
//    
//    var minutes_of_work = 5 * Number(apps_left);
//    var hours_of_work = minutes_of_work / 60;
//    var how_much_work = minutes_of_work.toFixed(0).toString() + " minutes";
//    if (minutes_of_work > 60) how_much_work = hours_of_work.toFixed(1).toString() + " hours";
//    
////    if (Number(apps_viewed) >= Number(group_average)) continue; 
//    if (Number(apps_viewed) >= 46) continue; 
//    
//    //You have read 5 of 35 applications (group average is 15).  You have 15 days to read the remaining 30 applications (need to read an average of 2 per day). 
//    
//    var html = "<p>Dearest " + name + ",</p>";
//
//     html += "<p>The Grant Robot thinks you have scored " + apps_viewed + " of " + total_apps + " applications (group average is " + Number(group_average).toFixed(1).toString() + ").  " + 
////       "There " + ((Math.abs(days_left) != 1) ? "are " : "is ") + days_left + " day" + ((Math.abs(days_left) != 1) ? "s" : "") + 
//         "<b>You have until noon today</b> " +
//         " to score the remaining " + apps_left + " applications (need to score an average of " + Number(average_per_day_to_finish).toFixed(1).toString() + " per day to finish on time).  " + 
//                   "If you spend an average of 5 minutes on each unscored application, it will take at least " + how_much_work + " to get through all of them." + 
//                   "</p>"; 
//
//    html += "<p><b>It is important to be logged in to your Ignition account when you are scoring the applications.  If you aren't logged in, a gigantic message will appear at the top of the application you are scoring.  " +
//      "If you see that, you aren't logged in and you aren't getting credit for viewing the application.  If your scores aren't showing up in the dashboard: either you aren't logged in, or something is wrong.  " + 
//      "Email " + properties.getProperty("help_email") + " if something weird is happening. </b></p>";
//
//    
//    html += "<p><b>Seed Round Dashboard: " + properties.getProperty("dashboard_url") + "</b></p>";
//    html += "<p><b>Scoring ends on " + FormatExactDate_(properties.getProperty("cats_score_end_date")) + ".  You must score all applications by that time.</b></p>";
//    
//    html += "<p>Love,</p>" + 
//            "<p>" + properties.getProperty("robot_email_name") + "</p>";
//    
//    var t = HtmlService.createTemplate(html);
//    var email_body = t.evaluate().getContent();
//    
//    MailApp.sendEmail({
////      to: "grandpa@apogaea.com",
//      to: cat,
//      bcc: properties.getProperty("script_owner_email"),
//      name: properties.getProperty("robot_email_name"),
//      replyTo: properties.getProperty("help_email"),
//      subject: "MUST FINISH BY NOON TODAY: Seed Money Round scoring reminder",
//      htmlBody: email_body
//    });
//
//    //    UpdateRow_(ApplicationsSheet, "Application ID", Applications[i]["Application ID"], "Decision Email Date", new Date());
//    
//  }
//  
//}

//function SendQuestionNotifications() {
//  SendQuestionNotificationsEmailOption_(true);
//} 
//
//function UpdateQuestionCounts() {
//  SendQuestionNotificationsEmailOption_(false);
//}
//
//function SendQuestionNotificationsEmailOption_(send_email) {
//  Logger.log("SendQuestionNotificationsEmailOption_(): START");
//
//  if (send_email == undefined) send_email = false;
//  
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//  var ApplicationsSheet = new Sheet_(robot.getSheetByName("Applications")).cacheOff();
//  var db = new MemDB_(ApplicationsSheet.getData());
//  db.addFilter({"Status":"Review"});
//
//  var Applications = db.getData();
//  Logger.log(JSON.stringify(Applications));
//  for (var i = 0; i < Applications.length; i++) {
//    Logger.log("AppID: " + Applications[i]["Application ID"]);
//    var Application = new Application_(Applications[i]["Application ID"]);
//    var url = Application.getConfigurationValue("Application Url");
//    var edit_url = Application.getConfigurationValue("Edit Url");
//    var QuestionsSheet =  Sheet_(Application.getApplication().getSheetByName("Questions"));
//    var Questions = QuestionsSheet.getData();
//    var num_questions = Questions.length;
//    var num_responses = 0;
//    var html = "";
//    
//    for (var j = 0; j < Questions.length; j++) { 
//      
//      if (Questions[j]["Question"] != "" &&
//          Questions[j]["Question Email Date"] == "") {
//        
//        // send question notification
//    
//        html += "<h2>" + Questions[j]["Name"] + " asks the following:</h2>" + 
//          "<p><b>" + Questions[j]["Question"] + "</b></p>";
//        
//        if (send_email) {
//          var result = QuestionsSheet.updateRow("Question ID", Questions[j]["Question ID"], {"Question Email Date": new Date()});
//          Logger.log("Updated question");
//        }
//        
//        QuestionsSheet.getData();
//        
//      }
//      
//      if(Questions[j]["Response"] != "") num_responses++;
//      
//      if (Questions[j]["Response"] != "" &&
//          Questions[j]["Response Email Date"] == "") {
//
//        // send response notification
//        var response_html = "<p>Dearest " + Questions[j]["Name"] + ",</p>"+
//          "<p><b>You asked:</b></p>" + 
//          "<p>" + Questions[j]["Question"] + "</p>" + 
//          "<p><b>" + Application.getResponseValue("AlternateName") + " responded:</b></p>" + 
//          "<p>" + Questions[j]["Response"] + "</p>" + 
//          "<p><b>View the application: " + url + "</b></p>" + 
//          "<p>If you have questions or issues with the application, email " + properties.getProperty("help_email") + " for assistance.</p>" +
//          "<p>Love,</p>" + 
//          "<p>"+ properties.getProperty("robot_email_name") + "</p>";
//        
//        var t = HtmlService.createTemplate(response_html);
//        var email_body = t.evaluate().getContent();
//        
//        if (send_email) {
//          MailApp.sendEmail({
//            //          to: "grandpa@apogaea.com",
//            to: Questions[j]["Email"],
//            name: properties.getProperty("robot_email_name"),
//            bcc: properties.getProperty("script_owner_email"),
//            replyTo: properties.getProperty("help_email"),
//            subject: Application.getResponseValue("AlternateName") + " has responded to your question about \"" +  Application.getResponseValue("ProjectName") + "\"",
//            htmlBody: email_body
//          });
//
//          var result = QuestionsSheet.updateRow("Question ID", Questions[j]["Question ID"], {"Response Email Date": new Date()});
//          Logger.log("Response notification sent to: " + Questions[j]["Email"]);
//          
//        }
//
//      }
//      
//    }
//
//    if (html != "") {
//
//      html += "<p></p>" + 
//        "<h1>Respond to questions in your application: " + edit_url + "</h1>" + 
//              "<p><b>You may answer questions and edit your application until " + FormatExactDate_(properties.getProperty("applications_final_date")) + ".  " + 
//                "</b></p>" + 
//              "<p>If you have questions or issues with the application, email " + properties.getProperty("help_email") + " for assistance.</p>" +
//              "<p>Love,</p>" + 
//              "<p>" + properties.getProperty("robot_email_name") + "</p>";
//      
//      var t = HtmlService.createTemplate(html);
//      var email_body = t.evaluate().getContent();
//      
//      if (send_email) {
//        MailApp.sendEmail({
//          //        to: "grandpa@apogaea.com",
//          to: Application.getConfigurationValue("Email"),
//          name: properties.getProperty("robot_email_name"),
//          bcc: properties.getProperty("script_owner_email"),
//          replyTo: properties.getProperty("help_email"),
//          subject: "There is a new question regarding your project \"" + Application.getResponseValue("ProjectName") + "\"",
//          htmlBody: email_body
//        });
//      }
//      
//      Logger.log("Question notification sent to: " + Application.getConfigurationValue("Email"));
//
//    }
//    
//    ApplicationsSheet.updateRow("Application ID", Applications[i]["Application ID"], {"Questions": num_questions,
//                                                                                            "Responses": num_responses});
//    
//  }
//  Logger.log("SendQuestionNotifications(): DONE");
//}

////function SendApplicationFinalReminder() {
////  
////  var properties = PropertiesService.getScriptProperties();
////  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
////  var ApplicationsSheet = robot.getSheetByName("Applications");
////  var Applications = new DB_(ApplicationsSheet)
////                          .addFilter({Status:"Review", "Application Final Reminder Email Date":""})
////                          .getData();
////  
////  for (var i = 0; i < Applications.length; i++) {
////    var unanswered = Applications[i]["Questions"] - Applications[i]["Responses"];
////    if (unanswered <= 0) continue;
////    
////    var application = SpreadsheetApp.openById(Applications[i]["Application ID"]);
////
////    var url = application.getRangeByName("RobotUrl").getValue();
////    var html = "<p>Thank you for submitting an Apogaea " + properties.getProperty("round_name") + " application!</p>";
////
////     html += "<p>CATS, the Apogaea grant selection entity, will be reviewing your application between " + 
////             FormatDate_(properties.getProperty("cats_review_begin_date")) + " and " + FormatDate(properties.getProperty("cats_review_end_date")) + ".  During this time, CATS might have " + 
////             "questions about your application.  You will be notified by email if there is a question for you. " + 
////             "You may answer questions and edit your application until " + properties.getProperty("applications_final") + ".</p>"; 
////    
////    if (unanswered != 0) {
////      html += "<p><b>The Grant Robot noticed you have " + unanswered + " unanswered question" + ((unanswered > 1) ? "s" : "") + " about your application.  " + 
////              "Be sure to answer " + ((unanswered > 1) ? "them" : "it") + " before the deadline.</b></p>";
////    }
////      
////    html += "<p><b>Your grant application: " + url + "</b></p>";
////
////    html += "<p>All applicants will be emailed the results on or around " + FormatDate_(properties.getProperty("applicants_notified_date")) + "</p>";
////
////    html += "<p>If you are having issues with your application, email " + properties.getProperty("help_email") + " for assistance.</p>" +
////            "<p>Love,</p>" + 
////            "<p>" + properties.getProperty("robot_email_name") + "</p>";
////    
////    var t = HtmlService.createTemplate(html);
////    var email_body = t.evaluate().getContent();
////    
////    MailApp.sendEmail({
//////      to: "grandpa@apogaea.com",
////       to: application.getRangeByName("Email").getValue(),
////       bcc: properties.getProperty("script_owner_email"),
//          name: properties.getProperty("robot_email_name"),
////      replyTo: properties.getProperty("help_email"),
////      subject: "Less than 24 hours remain to answer " + unanswered + " question" + ((unanswered > 1) ? "s" : "") + " regarding your grant application",
////      htmlBody: email_body
////    });
////
////    UpdateRow_(ApplicationsSheet, "Application ID", Applications[i]["Application ID"], "Application Final Reminder Email Date", new Date());
////    
////  }
////
////}

//function SendApplicationFinal() {
//  
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//  var ApplicationsSheet = new Sheet_(robot.getSheetByName("Applications")).cacheOff();
//  var Applications = new MemDB_(ApplicationsSheet.getData())
//                          .addFilter({"Status":"Review", "Application Final Email Date":""})
//                          .getData();
//  
//  for (var i = 0; i < Applications.length; i++) {
//    
//    var Application = new Application_(Applications[i]["Application ID"]);
//    var url = Application.getConfigurationValue("Edit Url");
//    var html = "<p>Thank you for submitting an Apogaea " + properties.getProperty("round_name") + " application!</p>";
//
//     html += "<p>Your application is now considered final and no further editing will be allowed.  " + 
//       "CATS, the Apogaea grant selection entity, will be wrapping up the grant selection process over the course of the " + 
//       "next several days.  All applicants will be emailed the results on or around " + FormatDate_(properties.getProperty("applicants_notified_date")) + ".</p>"; 
//      
////    html += "<p><b>View your grant application: " + url + "</b></p>";
////    html += "<p>If you are having issues with your application, email " + properties.getProperty("help_email") + " for assistance.</p>";
//    
//    html += "<p>Love,</p>" + 
//            "<p>" + properties.getProperty("robot_email_name") + "</p>";
//    
//    var t = HtmlService.createTemplate(html);
//    var email_body = t.evaluate().getContent();
//    
//    MailApp.sendEmail({
////      to: "grandpa@apogaea.com",
//      to: Application.getConfigurationValue("Email"),
//      bcc: properties.getProperty("script_owner_email"),
//      name: properties.getProperty("robot_email_name"),
//      replyTo: properties.getProperty("help_email"),
//      subject: "Your Apogaea grant application is now final",
//      htmlBody: email_body
//    });
//
//    ApplicationsSheet.updateRow("Application ID", Applications[i]["Application ID"], {"Application Final Email Date": new Date()});
//    
//  }
//
//}

//function CloseApplicationWindow() {
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//  var sheet = new Sheet_(robot.getSheetByName("Configuration"));
//  sheet.updateRow("Key", "accepting_applications", {"Value":"No"});
//  UpdateConfig();
//}
//
//function OpenApplicationWindow() {
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//}
//
//function SendReviewEmail() {
//  
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//  var ApplicationsSheet = new Sheet_(robot.getSheetByName("Applications"));
//  var Applications = new MemDB_(ApplicationsSheet.getData()).addFilter({Status:"Review", "Review Email Date":""}).getData();
//  
//  for (var i = 0; i < Applications.length; i++) {
//
//    var Application = new Application_(Applications[i]["Application ID"]);
//    var url = Application.getConfigurationValue("Edit Url");
//    var html = "<p>Congratulations, " + Application.getResponseValue("AlternateName") + "!  You have successfully submitted a complete Apogaea " + 
//                properties.getProperty("round_name") + " application before the deadline!  " + 
//                "That means you have made the first cut!</p>" + 
//                "<h2>What happens next?</h2>" + 
//                "<p>CATS, the Apogaea grant selection entity, will review your application between " + 
//                FormatDate_(properties.getProperty("cats_review_begin_date")) + " and " + FormatDate_(properties.getProperty("cats_review_end_date")) + ".  During this Question and Answer period, CATS might ask you " + 
//                "questions about your application.  You will be notified by email if there is a question for you. " + 
//                "You may answer questions and edit your application until " + FormatExactDate_(properties.getProperty("applications_final_date")) + ".</p>" + 
//                "<p><b>Your application: " + url + "</b></p>" + 
//                "<p>All applicants will be emailed the results on or around " + FormatDate_(properties.getProperty("applicants_notified_date")) + ".</p>" + 
//                "<p>If you have questions or issues with your application, email " + properties.getProperty("help_email") + " for assistance.</p>" +
//                "<p>Love,</p>" + 
//                "<p>" + properties.getProperty("robot_email_name") + "</p>";
//        
//    var t = HtmlService.createTemplate(html);
//    var email_body = t.evaluate().getContent();
//    
//    MailApp.sendEmail({
////      to: "grandpa@apogaea.com",
//      to: Application.getConfigurationValue("Email"),
//      bcc: properties.getProperty("script_owner_email"),
//      name: properties.getProperty("robot_email_name"),
//      replyTo: properties.getProperty("help_email"),
//      subject: "Your Apogaea grant application has been received and is being reviewed by CATS",
//      htmlBody: email_body
//    });
//
//    ApplicationsSheet.updateRow("Application ID", Application.getId(), {"Review Email Date": new Date()});
//
//  }
//
//}
//function PromoteNewStatus() {
//  
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//  var ApplicationsSheet = new Sheet_(robot.getSheetByName("Applications"));
//  var Applications = new MemDB_(ApplicationsSheet.getData()).addFilter({Status:"New"}).getData();
//  var Robot = new Robot_();
//
//  for (var i = 0; i < Applications.length; i++) {
//
//    var Application = new Application_(Applications[i]["Application ID"]);
//
//    var Errors = Application.preFlight();  
//    
//    if (Errors.length == 0) {
//      Application.setConfigurationValue("Status", "Review");
//      Application.setConfigurationValue("CATS View", "Yes");
//      Application.setConfigurationValue("CATS QnA Open", "Yes");
//      Application.setConfigurationValue("Edit Open", "Yes");
//      Logger.log("REVIEW: " + Application.getId());
//    } else {
//      Application.setConfigurationValue("Status", "Withdraw");
//      Application.setConfigurationValue("Edit Open", "No");
//      Logger.log("WITHDRAW: " + Application.getId());
//    }
//    
//    Robot.syncApplication(Application);
//  }
//  
//}
//
//function SendWithdrawEmail() {
//  
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//  var ApplicationsSheet = new Sheet_(robot.getSheetByName("Applications"));
//  var Applications = new MemDB_(ApplicationsSheet.getData()).addFilter({Status:"Withdraw", "Review Email Date":""}).getData();
//
//  for (var i = 0; i < Applications.length; i++) {
//
//    var Application = new Application_(Applications[i]["Application ID"]);
//
//    var Errors = Application.preFlight();  
//    
//    if (Errors.length <= 0) {
////      ApplicationsSheet.updateRow("Application ID", Application.getId(), {"Review Email Date": "N/A"});
//      continue;
//    }
//
//    var url = Application.getConfigurationValue("Edit Url");
//    var html = "<p>Thank you for beginning an Apogaea " + properties.getProperty("round_name") + " application!</p>" + 
//
//               "All applications needed to be complete and error free before the application window " + 
//               "closed on " + FormatExactDate_(properties.getProperty("application_deadline_date")) + ".  " + 
//               "Incomplete applications or applications with errors after the deadline can not " + 
//               "be considered.</p>" + 
//
//               "<p>Your application was withdrawn from consideration because the Grant Robot found the following errors in your application after the deadline:" + 
//              "<ul>";
//    for (var j = 0; j < Errors.length; j++) {
//      html += "<li>" + Errors[j]["Error"] + "</li>";
//    } 
//    html += "</ul>";
//    html += "<p>Thank you for participating in the Apogaea grant process.  This will be the last email you will receive about your application.</p>" +
//            "<p>Love,</p>" + 
//            "<p>" + properties.getProperty("robot_email_name") + "</p>";
//    
//    var t = HtmlService.createTemplate(html);
//    var email_body = t.evaluate().getContent();
//    
//    MailApp.sendEmail({
////      to: "grandpa@apogaea.com",
//      to: Application.getConfigurationValue("Email"),
//      bcc: properties.getProperty("script_owner_email"),
//      name: properties.getProperty("robot_email_name"),
//      replyTo: properties.getProperty("help_email"),
//      subject: "Your Apogaea grant application has been withdrawn from consideration",
//      htmlBody: email_body
//    });
//
//    ApplicationsSheet.updateRow("Application ID", Application.getId(), {"Review Email Date": new Date()});
//
//  }
//
//}
//
//function Send5DayApplicationCloseReminder() {
//  
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//  var ApplicationsSheet = new Sheet_(robot.getSheetByName("Applications"));
//  var Applications = new MemDB_(ApplicationsSheet.getData()).addExclude({"Status":"Withdraw"}).getData();
//
//  for (var i = 0; i < Applications.length; i++) {
//    var Application = new Application_(Applications[i]["Application ID"]);
//
//    var Errors = Application.preFlight();  
//    
//    var url = Application.getConfigurationValue("Edit Url");
//    var html = "";
//    var subject = "";
//
//    subject = "Your Apogaea grant application must be complete and error free in less than 7 days";
//    
//
//    if (Errors.length <= 0 || Applications[i]["7Day Remind Email Date"] != "") {
//
//    ApplicationsSheet.updateRow("Application ID", Applications[i]["Application ID"], {"7Day Remind Email Date":"N/A"});
//      continue;
//
//    } else {
//            
//      html = "<p>Thank you for beginning an Apogaea " + properties.getProperty("round_name") + " application!</p>";
//
//      html += "<p>All applications must be complete and error free before the application window " + 
//              "closes on " + FormatExactDate_(properties.getProperty("application_deadline_date")) + ".  " + 
//              "Incomplete applications or applications with errors after the deadline will " + 
//              "be withdrawn from consideration.</p>";
//      
//      html += "<p>The Grant Robot found the following errors in your application:</p>" + 
//                "<ul>";
//      for (var j = 0; j < Errors.length; j++) {
//        html += "<li>" + Errors[j]["Error"] + "</li>";
//      } 
//  
//      html += "</ul>";
//      html += "<p><b>In order to be considered for a grant, the errors above must be fixed in the application before " + 
//              FormatExactDate_(properties.getProperty("application_deadline_date")) + ".  The sooner your application is " + 
//              "error free, the sooner the selection committee can begin reading it.  The more time they have to read it, " + 
//              "the better they can understand it and/or address any issues with the application.</b></p>";
//
//    }
//    
//    html += "<p><b>Your grant application: " + url + "</b></p>";
//    html += "<p>If you are having issues with your application, email " + properties.getProperty("help_email") + " for assistance.</p>" +
//            "<p>Love,</p>" + 
//            "<p>" + properties.getProperty("robot_email_name") + "</p>";
//    
//    var t = HtmlService.createTemplate(html);
//    var email_body = t.evaluate().getContent();
//    
//    MailApp.sendEmail({
////      to: "grandpa@apogaea.com",
//      to: Application.getConfigurationValue("Email"),
//      bcc: properties.getProperty("script_owner_email"),
//          name: properties.getProperty("robot_email_name"),
//      replyTo: properties.getProperty("help_email"),
//      subject: subject,
//      htmlBody: email_body
//    });
//
//    ApplicationsSheet.updateRow("Application ID", Applications[i]["Application ID"], {"7Day Remind Email Date": new Date()});
//    
//  }
//
//}
//
//function Send48HourApplicationCloseReminder() {
//  
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//  var ApplicationsSheet = new Sheet_(robot.getSheetByName("Applications"));
//  var Applications = new MemDB_(ApplicationsSheet.getData()).addExclude({"Status":"Withdraw"}).getData();
//
//  for (var i = 0; i < Applications.length; i++) {
//    var Application = new Application_(Applications[i]["Application ID"]);
//
//    var Errors = Application.preFlight();  
//    
//    var url = Application.getConfigurationValue("Edit Url");
//    var html = "";
//    var subject = "";
//
//    subject = "Your Apogaea grant application must be complete and error free in less than 48 hours";
//    
//
//    if (Errors.length <= 0 || Applications[i]["48Hr Remind Email Date"] != "") {
//
//    ApplicationsSheet.updateRow("Application ID", Applications[i]["Application ID"], {"48Hr Remind Email Date":"N/A"});
//      continue;
//      
//    } else {
//            
//      html = "<p>Thank you for beginning an Apogaea " + properties.getProperty("round_name") + " application!</p>";
//
//      html += "<p>All applications must be complete and error free before the application window " + 
//              "closes on " + FormatExactDate_(properties.getProperty("application_deadline_date")) + ".  " + 
//              "Incomplete applications or applications with errors after the deadline will " + 
//              "be withdrawn from consideration.</p>";
//      
//      html += "<p>The Grant Robot found the following errors in your application:</p>" + 
//                "<ul>";
//      for (var j = 0; j < Errors.length; j++) {
//        html += "<li>" + Errors[j]["Error"] + "</li>";
//      } 
//  
//      html += "</ul>";
//      html += "<p><b>In order to be considered for a grant, the errors above must be fixed in the application before " + 
//              FormatExactDate_(properties.getProperty("application_deadline_date")) + ".  The sooner your application is " + 
//              "error free, the sooner the selection committee can begin reading it.  The more time they have to read it, " + 
//              "the better they can understand it and/or address any issues with the application.</b></p>";
//
//    }
//    
//    html += "<p><b>Your grant application: " + url + "</b></p>";
//    html += "<p>If you are having issues with your application, email " + properties.getProperty("help_email") + " for assistance.</p>" +
//            "<p>Love,</p>" + 
//            "<p>" + properties.getProperty("robot_email_name") + "</p>";
//    
//    var t = HtmlService.createTemplate(html);
//    var email_body = t.evaluate().getContent();
//    
//    MailApp.sendEmail({
////      to: "grandpa@apogaea.com",
//      to: Application.getConfigurationValue("Email"),
//      bcc: properties.getProperty("script_owner_email"),
//          name: properties.getProperty("robot_email_name"),
//      replyTo: properties.getProperty("help_email"),
//      subject: subject,
//      htmlBody: email_body
//    });
//
//    ApplicationsSheet.updateRow("Application ID", Applications[i]["Application ID"], {"48Hr Remind Email Date": new Date()});
//    
////    return;
//    
//  }
//
//}
//
//function Send24HourApplicationCloseReminder() {
//  
//  var properties = PropertiesService.getScriptProperties();
//  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
//  var ApplicationsSheet = new Sheet_(robot.getSheetByName("Applications"));
//  var Applications = new MemDB_(ApplicationsSheet.getData()).addExclude({"Status":"Withdraw"}).addFilter({"24Hr Remind Email Date":""}).getData();
//
//  for (var i = 0; i < Applications.length; i++) {
//    var Application = new Application_(Applications[i]["Application ID"]);
//
//    var Errors = Application.preFlight();  
//    
//    var url = Application.getConfigurationValue("Edit Url");
//    var html = "";
//    var subject = "";
//
//    subject = "Your Apogaea grant application must be complete and error free before 11:59PM Mountain time tonight";
//
//    if (Errors.length <= 0) {
//
//      ApplicationsSheet.updateRow("Application ID", Applications[i]["Application ID"], {"24Hr Remind Email Date":"N/A"});
//      continue;
//
//    } else {
//            
//      html = "<p>Thank you for beginning an Apogaea " + properties.getProperty("round_name") + " application!</p>";
//
//      html += "<p>All applications must be complete and error free before the application window " + 
//              "closes on " + FormatExactDate_(properties.getProperty("application_deadline_date")) + ".  " + 
//              "Incomplete applications or applications with errors after the deadline will " + 
//              "be withdrawn from consideration.</p>";
//      
//      html += "<p>The Grant Robot found the following errors in your application:</p>" + 
//                "<ul>";
//      for (var j = 0; j < Errors.length; j++) {
//        html += "<li>" + Errors[j]["Error"] + "</li>";
//      } 
//  
//      html += "</ul>";
//      html += "<p><b>In order to be considered for a grant, the errors above must be fixed in the application before " + 
//              FormatExactDate_(properties.getProperty("application_deadline_date")) + ".  The sooner your application is " + 
//              "error free, the sooner the selection committee can begin reading it.  The more time they have to read it, " + 
//              "the better they can understand it and/or address any issues with the application.</b></p>";
//    }
//    
//    html += "<p><b>Your grant application: " + url + "</b></p>";
//    html += "<p>If you are having issues with your application, email " + properties.getProperty("help_email") + " for assistance.</p>" +
//            "<p>Love,</p>" + 
//            "<p>" + properties.getProperty("robot_email_name") + "</p>";
//    
//    var t = HtmlService.createTemplate(html);
//    var email_body = t.evaluate().getContent();
//    
//    MailApp.sendEmail({
////      to: "grandpa@apogaea.com",
//      to: Application.getConfigurationValue("Email"),
//      bcc: properties.getProperty("script_owner_email"),
//      name: properties.getProperty("robot_email_name"),
//      replyTo: properties.getProperty("help_email"),
//      subject: subject,
//      htmlBody: email_body
//    });
//
//    ApplicationsSheet.updateRow("Application ID", Applications[i]["Application ID"], {"24Hr Remind Email Date": new Date()});
//    
//  }
//
//}
function LoadCATS() {
  var properties = PropertiesService.getScriptProperties();
  var sheet = new Sheet_(SpreadsheetApp.openById(properties.getProperty("robot_id")).getSheetByName("CATS"));
  var cache_key = "CATS";
  properties.setProperty(cache_key, JSON.stringify(sheet.getData())); 
}

function LoadQuotes() {
  Logger.log("LoadQuotes(): START");
  var properties = PropertiesService.getScriptProperties();
  var q_sheet = SpreadsheetApp.openById(properties.getProperty("robot_id")).getSheetByName("Quotes");
  var quotes = new Sheet_(q_sheet).getData();
  properties.setProperty("quotes", JSON.stringify(quotes));     
  Logger.log("LoadQuotes(): LOADED " + quotes.length + " QUOTES");
  Logger.log("LoadQuotes(): END");
}

//function InitialSetup() {
//  var properties = PropertiesService.getScriptProperties();
//  var robot_id = properties.getProperty("robot_id");
//  if (robot_id == null) robot_id = SpreadsheetApp.getActiveSpreadsheet().getId();
//  properties.deleteAllProperties();
//  properties.setProperty("robot_id", robot_id);
//  var parent_dirs = DriveApp.getFileById(robot_id).getParents();
//  var parent_dir = parent_dirs.next();
//  var app_folder = parent_dir.addFolder("Applications");
//  Drive.Permissions.insert(
//    {
//      'role': 'writer',
//      'type': 'user',
//      'value': 'grandpa@apogaea.com'
//    },
//      app_folder.getId(),
//    {
//      'sendNotificationEmails': 'false'
//    }
//  );  
//
//  Drive.Permissions.insert(
//    {
//      'role': 'reader',
//      'type': 'group',
//      'value': 'grants@apogaea.com'
//    },
//      app_folder.getId(),
//    {
//      'sendNotificationEmails': 'false'
//    }
//  );  
//
//  Drive.Permissions.insert(
//    {
//      'role': 'reader',
//      'type': 'group',
//      'value': 'accounting@apogaea.com'
//    },
//      app_folder.getId(),
//    {
//      'sendNotificationEmails': 'false'
//    }
//  );  
//
//}
//function InstallTriggers() { 
//  var properties = PropertiesService.getScriptProperties();
//  var Robot = new Robot_();
//  var db = Robot.getTriggersDb();
//  var sheet = db.getSheet();
//  var data;
//  
//  data = db.addFilter({"Function Name":"OpenApplicationWindowTrigger"}).getData();
//
//  if (data.length != 1) {
//    var fire_date = new Date(properties.getProperty("application_open_date"));
//    var trigger = ScriptApp.newTrigger("OpenApplicationWindow")
//    .timeBased()
//    .at(fire_date)
//    .create();  
//    
//    var row = {
//      "Trigger ID":trigger.getUniqueId(),
//      "Function Name":trigger.getHandlerFunction(),
//      "Run Date": fire_date,
//      "Executed Date":""
//    };
//    DB_.insertRow(sheet, row);
//    
//  }
//
//  data = db.addFilter({"Function Name":"CloseApplicationWindowTrigger"}).getData();
//
//  if (data.length != 1) {
//    var fire_date = new Date(properties.getProperty("application_deadline_date"));
//    var trigger = ScriptApp.newTrigger("CloseApplicationWindow")
//    .timeBased()
//    .at(fire_date)
//    .create();  
//    
//    var row = {
//      "Trigger ID":trigger.getUniqueId(),
//      "Function Name":trigger.getHandlerFunction(),
//      "Run Date": fire_date,
//      "Executed Date":""
//    };
//    DB_.insertRow(sheet, row);
//    
//  }
//
//  data = db.addFilter({"Function Name":"CreateNewApplications"}).getData();
//
//  if (data.length != 1) {
//    var trigger = ScriptApp.newTrigger("CreateNewApplications")
//    .timeBased()
//    .everyMinutes(5)
//    .create();  
//    
//    var row = {
//      "Trigger ID":trigger.getUniqueId(),
//      "Function Name":trigger.getHandlerFunction()
//    };
//    DB_.insertRow(sheet, row);
//    
//  }
//
//}

function Application_(aid) {
  
  if (aid == undefined) throw new Error("Application() requires an application id");
  
  var application_id = aid;
  var cache = CacheService.getScriptCache();
  var debug = false;
  var properties = PropertiesService.getScriptProperties();
  var self = this;
  
  var application;
  var budget;
  var configuration;
  var files;
  var questions;
  var responses;
  var scores;
  
  var getApplicationData = function(sheet_name) {
    var cache_key = "Sheet_.getData" + application_id + sheet_name;
    var cached = cache.get(cache_key);
    var data = [];
    if (cached == null) {
      if (debug) Logger.log("getApplicationData(" + sheet_name + "): cache miss");
      openApplication();
      var sheet = new Sheet_(application.getSheetByName(sheet_name));
      data = sheet.getData(false);
      cache.put(cache_key, JSON.stringify(data), 21600); 
    } else {
      data = JSON.parse(cached);      
    }
    if (debug) Logger.log("getApplicationData(" + sheet_name + "): data.length: " + data.length);
    return data;
  }
  
  var getFilesFromFolder = function(folder, label) {
    var files = [];
    var root;
    if (label == undefined) {
      label = "";
      root = true;
    } else { 
      root = false;
    }
    
    var new_files = folder.getFiles();
    while (new_files.hasNext()) {
      var file = new_files.next();
      var new_file = {};
      new_file["File ID"] = file.getId();
      new_file["File name"] = file.getName();
      new_file["Path"] = label;
      new_file["Date"] = file.getDateCreated();
      new_file["Content Type"] = file.getBlob().getContentType();
      new_file["URL"] = file.getUrl();
      files.unshift(new_file);
    }
    
    var sub_folders = folder.getFolders();
    while (sub_folders.hasNext()) {
      var sub_folder = sub_folders.next();
      if (root) label = sub_folder.getName();
      var sub_files = getFilesFromFolder(sub_folder, label);
      for (var i = 0; i < sub_files.length; i++) {
        files.push(sub_files[i]);      
      }
    }
    return files;
  }
  
  var openApplication = function() { 
    if (application == undefined && application_id != undefined) {
      if (debug) Logger.log("openApplication(): opening application " + application_id);
      application = SpreadsheetApp.openById(application_id); 
    }
  }
  
  this.clearCache = function(key) {
    if (key == undefined) {
      if (debug) Logger.log("clearCache(): clearing entire cache");
      cache.removeAll([
          "Sheet_.getData" + application_id + "Configuration",
          "Sheet_.getData" + application_id + "Responses",
          "Sheet_.getData" + application_id + "Budget",
          "Sheet_.getData" + application_id + "Files",
          "Sheet_.getData" + application_id + "Questions",
          "Sheet_.getData" + application_id + "Score"
        ]
      );

      budget = undefined;
      configuration = undefined;
      files = undefined;
      questions = undefined;
      responses = undefined;
      scores = undefined;

    }
    else {
      if (debug) Logger.log("clearCache(): clearing cache key: " + key);
      cache.remove("Sheet_.getData" + application_id + key); 
    
      if (key == "Budget") budget = undefined;
      else if (key == "Configuration") configuration = undefined;
      else if (key == "Files") files = undefined;
      else if (key == "Questions") questions = undefined;
      else if (key == "Responses") responses = undefined;
      else if (key == "Score") scores = undefined;
    }
  }

  this.debugOn = function() { debug = true; }

  this.debugOff = function() { debug = false; }

  this.getApplicantFunds = function() {
    var applicant_funds = 0;
    var data = self.getBudget();
    var length = data.length;
    for (var i = 0; i < length; i++) {
      if (data[i]["Type"] == "Applicant") applicant_funds += Number(data[i]["Cost"]);
    }
    if (debug) Logger.log("getApplicantFunds(): " + applicant_funds);
    return applicant_funds;
  }
  
  this.getApplication = function() { 
    if (debug) Logger.log("getApplication()");
    openApplication(); 
    return application; 
  }
  
  this.getBudget = function() { 
    if (debug) Logger.log("getBudget()");
    return getApplicationData("Budget"); 
  }

  this.getBudgetDb = function() { 
    if (debug) Logger.log("getBudgetDb()");
    if (budget == undefined) budget = new MemDB_(self.getBudget()); 
    return budget; 
  }

  this.getConfiguration = function() { 
    if (debug) Logger.log("getConfiguration()");
    return getApplicationData("Configuration"); 
  }

  this.getConfigurationDb = function() { 
    if (debug) Logger.log("getConfigurationDb()");
    if (configuration == undefined) configuration = new MemDB_(self.getConfiguration()); 
    return configuration; 
  }

  this.getConfigurationValue = function(key) { 
    var data = self.getConfigurationDb().clearFilters().addFilter({"Key": key}).getData();
    if (data.length != 1) {
      throw new Error("CONFIGURATION KEY " + key + " NOT FOUND");
    } else { 
      if (debug) Logger.log("getConfigurationValue(): '" + key + "':'" + data[0]["Value"] + "'");
      return data[0]["Value"]; 
    }
  }

  this.getEventPopulation = function() { 
    if (debug) Logger.log("getEventPopulation()");
    return new Number(properties.getProperty("event_population")); 
  }
  
  this.getFiles = function() { 
    if (debug) Logger.log("getFiles()");
    return getApplicationData("Files"); 
  }

  this.getFilesDb = function() { 
    if (debug) Logger.log("getFilesDb()");
//    openApplication(); 
    if (files == undefined) files = new MemDB_(self.getFiles()); 
    return files; 
  }

  this.getGrantAsPercentOfCurrentRoundBudget = function() { 
    if (debug) Logger.log("getGrantAsPercentOfCurrentRoundBudget()");
    return (self.getRequestedGrantAmount() / self.getRoundBudget()) * 100; 
  } 

  this.getGrantTicketAmount = function() { 
        if (debug) Logger.log("getGrantTicketAmount()");
    return self.getGrantAsPercentOfCurrentRoundBudget() * 0.01 * (self.getTicketPrice() * ( self.getRoundBudget() / (self.getEventPopulation() * self.getTicketPrice()))); 
  }
  this.getGrantValue = function() { 
    if (debug) Logger.log("getGrantValue()");
    var grant = self.getRequestedGrantAmount();
    if (grant <= 0) return 0;
    else return self.getTotalProjectCost() / self.getRequestedGrantAmount(); 
  } 
  
  this.getId = function() { 
    if (debug) Logger.log("getId()");
    return application_id; 
  }

  this.getPercentFunded = function() { 
    if (debug) Logger.log("getPercentFunded()");
    var project_cost = self.getTotalProjectCost();
    if (project_cost <= 0) return 0;
    else return (self.getRequestedGrantAmount() * 100) / project_cost; 
  } 

  this.getQuestions = function() { 
    if (debug) Logger.log("getQuestions()");
    return getApplicationData("Questions"); 
  }
  
  this.getQuestionsDb = function() { 
    if (debug) Logger.log("getQuestionsDb()");
    if (questions == undefined) questions = new MemDB_(self.getQuestions()); 
    return questions; 
  }

  this.getRequestedGrantAmount = function() { 
    if (debug) Logger.log("getRequestedGrantAmount()");
    var requested_grant_amount = 0;
    var data = self.getBudget();
    var length = data.length;
    for (var i = 0; i < length; i++) {
      if (data[i]["Type"] == "Grant") requested_grant_amount += Number(data[i]["Cost"]);
    }
    return requested_grant_amount;
  }

  this.getResponses = function() { 
    if (debug) Logger.log("getResponses()");
    return getApplicationData("Responses"); 
  }

  this.getResponsesDb = function() { 
    if (debug) Logger.log("getResponsesDb()");
    if (responses == undefined) responses = new MemDB_(self.getResponses()); 
    return responses; 
  }

  this.getResponseValue = function(key) { 
    if (debug) Logger.log("getResponseValue(" + key + ")");
    var data = self.getResponsesDb().clearFilters().addFilter({"Key": key}).getData();
    if (data.length != 1) {
      throw new Error("RESPONSE KEY " + key + " NOT FOUND");
    } else return data[0]["Value"]; 
  }

  this.getRoundBudget = function () { 
    if (debug) Logger.log("getRoundBudget()");
    return new Number(properties.getProperty("funds_available")); 
  }
  
  this.getScores = function() { 
    if (debug) Logger.log("getScores()");
    return getApplicationData("Score"); 
  }
  
  this.getScoresDb = function() { 
    if (debug) Logger.log("getScoresDb()");
    if (scores == undefined) scores = new MemDB_(self.getScores()); 
    return scores; 
  }
    
  this.getTicketPrice = function() { 
    if (debug) Logger.log("getTicketPrice()");
    return new Number(properties.getProperty("ticket_price")); 
  }
  
  this.getTotalProjectCost = function() { 
    if (debug) Logger.log("getTotalProjectCost()");
    return self.getRequestedGrantAmount() + self.getApplicantFunds(); 
  }

  this.preFlight = function() {
    if (debug) Logger.log("preFlight()");
    var Errors = [];
      
    var CheckNotEmpty = [
      ["ProjectName", "You must enter a project name"], 
      ["AlternateName", "You must enter an alternate name"], 
      ["LegalName", "You must enter the project lead's legal name"],
      ["Address", "You must enter the project lead's mailing address"],
      ["Category", "You must select a category"],
      ["Rating", "You must select a rating"],
      ["Description", "You must enter a description"],
      ["Logistics", "You must enter a logistics plan"],
      ["Team", "You must describe your team"],
      ["Safety", "You must describe your safety plan"],
      ["HasGenerator", "You must indicate whether or not you have a generator"],
      ["HasSound", "You must indicate whether or not you have sound"],
      ["HasFire", "You must indicate whether or not you have fuel/fire"]
    ];
    
    var category = self.getResponseValue("Category");
    if (category == "Effigy" || category == "Temple") {
      CheckNotEmpty.push(["Ownership", "Applications for the Effigy/Temple must describe how they feel about ownership of the art"]);
    }
  
    for (var i = 0; i < CheckNotEmpty.length; i++) {
      var key = CheckNotEmpty[i][0];
      var value = self.getResponseValue(key);
      var error_message = CheckNotEmpty[i][1];
      try {
        if (value == "") {
          Errors.push({"Key":key,"Error":error_message});
        }
      } catch (err) {
        Logger.log("PreFlight(): " + err.toString());
      }
    }
  
    var phone = self.getResponseValue("Phone");
    var phone_re = /^[0-9][0-9][0-9]-[0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]$/;
    if (!phone_re.exec(phone)) {
      Errors.push({"Key":"Phone","Error":"Your phone number must be in the format ###-###-####"});
    }
  
    var requested_grant_amount = self.getRequestedGrantAmount();
    var total_project_cost = self.getTotalProjectCost();
    var grant_value_vollar = self.getGrantValue();
  
    if (requested_grant_amount > properties.getProperty("round_max_grant")) {
      Errors.push({"Key":"Budget","Error":"The requested grant amount must be less than " + Currency_(properties.getProperty("round_max_grant"))});
    }
  
    if (Math.round((total_project_cost - requested_grant_amount) * 100) > 0 && self.getResponseValue("AdditionalIncome") == "") {
      Errors.push({"Key":"AdditionalIncome","Error":"The Additional Income section is blank and should describe the source(s) of the non-grant funds (e.g. fundraising, out of pocket, donated goods, etc.)"});
    }
    
    if (Math.round(total_project_cost * 100) <= 0) {
      Errors.push({"Key":"Budget","Error":"The total project cost is $0.  The budget hasn't been entered or has no items with a cost."});
    } else if (Math.round(requested_grant_amount * 100) <= 0) {
      Errors.push({"Key":"Budget","Error":"The requested grant amount is $0.  Are there any line items marked 'Grant' in the budget?"});
    }
    if (debug) Logger.log("preFlight(): Errors.length: " + Errors.length);

    return Errors;
    
  }
  
  this.setConfigurationValue = function(key, value) {
    if (debug) Logger.log("setConfigurationValue(" + key + "," + value + ")");
    openApplication();
    var configuration_sheet = new Sheet_(application.getSheetByName("Configuration"));
    if (configuration_sheet == undefined || configuration_sheet == null) throw Error("Can't get Configuration sheet in the application");
    configuration_sheet.updateRow("Key", key, {"Value":Trim_(value)});
  }
  
  this.setResponseValue = function(key, value) { 
    if (debug) Logger.log("setResponseValue(" + key + ", " + value + ")");
    openApplication();
    var responses_sheet = new Sheet_(application.getSheetByName("Responses"));
    if (responses_sheet == undefined || responses_sheet == null) throw Error("Can't get Responses sheet in the application");
    responses_sheet.updateRow("Key", key, {"Value":Trim_(value)});
  }  
  
 this.updateFiles = function() {
   if (debug) Logger.log("updateFiles()");
   
   var files_sheet = new Sheet_(self.getApplication().getSheetByName("Files"));
   var old_files_db = new MemDB_(files_sheet.getData());
   var update_data = getFilesFromFolder(DriveApp.getFolderById(self.getConfigurationValue("Files Directory ID")));
   var update_data_length = update_data.length;
   
   for (var i = 0; i < update_data_length; i++) {
    
     var result = old_files_db.clearFilters().addFilter({"File ID":update_data[i]["File ID"]}).getData();
     
     if (result.length == 1) {
      
       update_data[i]["Import Source"] = result[0]["Import Source"];
       
     }
     
   }
   
   files_sheet.truncate();
   files_sheet.insertRows(update_data);

 }

 if (debug) Logger.log("Application created : " + application_id); 
  return this; 

}

Application_.createApplication = function(email) {  
  Logger.log("createApplication(" + email + ")");
  var properties = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();

  var new_directory = DriveApp.getFolderById(properties.getProperty("applications_directory_id"));
  var app_folder = new_directory.createFolder(email);
  var upload_folder = app_folder.createFolder("Support Files");
  var signed_docs_folder = app_folder.createFolder("Signed Documents");
  var photo_documentation_folder = app_folder.createFolder("Photo Documentation");

  var application_file = DriveApp.getFileById(properties.getProperty("application_template_id")).makeCopy(email + " - (Application)", app_folder);
  var application = SpreadsheetApp.openById(application_file.getId());
  var application_id = application.getId();
  var applicant_url = ShortUrl_(ApplicationUrl_(application_id, properties))  
  
  app_folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.EDIT).setShareableByEditors(false);
  upload_folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT).setShareableByEditors(false);
  signed_docs_folder.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW).setShareableByEditors(false);
  photo_documentation_folder.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW).setShareableByEditors(false);
  application_file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.EDIT).setShareableByEditors(false);
 
  var configuration = new Sheet_(application.getSheetByName("Configuration"));
  var edit_token = UUID_();
  var edit_url = ShortUrl_(EditUrl_(application_id, edit_token, properties));
  
  configuration.updateRow("Key", "Email", {"Value":email});
  configuration.updateRow("Key", "Edit Token", {"Value":edit_token});
  configuration.updateRow("Key", "Edit Url", {"Value":edit_url});
  configuration.updateRow("Key", "Application ID", {"Value":application.getId()});
  configuration.updateRow("Key", "Application Url", {"Value":applicant_url});
  configuration.updateRow("Key", "Application Sheet Url", {"Value":ShortUrl_(application.getUrl())});
  configuration.updateRow("Key", "Files Directory ID", {"Value":upload_folder.getId()});
  configuration.updateRow("Key", "Files Directory Url", {"Value":ShortUrl_(upload_folder.getUrl())});
  configuration.updateRow("Key", "Application Directory ID", {"Value":app_folder.getId()});
  configuration.updateRow("Key", "Application Directory Url", {"Value":ShortUrl_(app_folder.getUrl())});
  configuration.updateRow("Key", "Photo Documentation Directory ID", {"Value":photo_documentation_folder.getId()});
  configuration.updateRow("Key", "Photo Documentation Directory Url", {"Value":ShortUrl_(photo_documentation_folder.getUrl())});
  configuration.updateRow("Key", "Signed Documents Directory ID", {"Value":signed_docs_folder.getId()});
  configuration.updateRow("Key", "Signed Documents Directory Url", {"Value":ShortUrl_(signed_docs_folder.getUrl())});
    
  var robot = SpreadsheetApp.openById(properties.getProperty("robot_id"));
  lock.waitLock(properties.getProperty("lock_timeout"));
  var new_applications_sheet = new Sheet_(robot.getSheetByName("New"));
  new_applications_sheet.updateRow("Email", email, {"Application ID":application.getId(), "Create Date":(new Date)});
  
  var applications_sheet = new Sheet_(robot.getSheetByName("Applications")).cacheOff();
  var last_row = applications_sheet.getSheet().getLastRow();
  applications_sheet.getSheet().insertRowAfter(last_row);
  var target_range = applications_sheet.getSheet().getRange(last_row + 1, 1, 1, applications_sheet.getSheet().getLastColumn());
  var target_cols = applications_sheet.getColumns();
  applications_sheet.getSheet().getRange(2, 1, 1, applications_sheet.getSheet().getLastColumn()).copyTo(target_range);
  applications_sheet.getSheet().getRange(target_range.getRow(), target_cols.indexOf("Application ID") + 1).setValue(application.getId());
  applications_sheet.getSheet().getRange(target_range.getRow(), target_cols.indexOf("Application Order") + 1).setValue(applications_sheet.getSheet().getLastRow() - applications_sheet.getSheet().getFrozenRows() + 1);
  lock.releaseLock();
  
  applications_sheet.clearCache();
  applications_sheet.reset();
      
  var html = 
       "<p><b>This is an important email regarding your Apogaea grant application.</b></p>" + 
       "<h2>Welcome to the " + properties.getProperty("round_name") + "!!</h2>" + 
       "<p>Now that we have confirmed your email address, the next step is getting to know more about you and your project.  " + 
         "Your application contains detailed instructions, application deadlines, and other critical information.</p>" + 
       "<p><b>Your application: " + edit_url + "</b></p>" + 
       "<p><b>Anyone with the link to your application can edit your application.  Only share it with people you trust.</b></p>" + 
       "<p>We use email to communicate with you.  It is important that you ensure that you are able to receive email from this address.  " + 
         "If you have any issues viewing or editing your application, email " + properties.getProperty("help_email") + " for assistance.</p>" + 
       "<p>Love,</p>" + 
       "<p>" + properties.getProperty("robot_email_name") + "</p>";
  
  var t = HtmlService.createTemplate(html);
  var email_body = t.evaluate().getContent();
  
  MailApp.sendEmail({
     to: email,
     bcc: properties.getProperty("script_owner_email"),
     name: properties.getProperty("robot_email_name"),
     replyTo: properties.getProperty("help_email"),
     subject: "We're ready to begin your Apogaea grant application!",
     htmlBody: email_body
  });

  Logger.log("createApplication(" + email + "): Application created: " + application.getId());

  return application;
}

Application_.prototype = { constructor: Application_ }

function Robot_() {

  var self = this;
  var cache = CacheService.getScriptCache();
  var properties = PropertiesService.getScriptProperties();
  var robot;
  var User = User_();
  var use_cache = true;
  var debug = false;
  var views;
  
  var openRobot = function() { if (robot == undefined) robot = SpreadsheetApp.openById(properties.getProperty("robot_id")); }

  this.getApplicationsDb = function() {
    
    openRobot();
    
    var ApplicationsSheet = new Sheet_(robot.getSheetByName("Applications"));
    var Applications = ApplicationsSheet.getData();

    if (debug) Logger.log("getApplicationsDb(): applications found: " + Applications.length);
    var ViewsSheet = new Sheet_(robot.getSheetByName("Views"));
    var ViewsDb = new MemDB_(ViewsSheet.getData());
    var ScoredSheet = new Sheet_(robot.getSheetByName("Scored"));
    var ScoredDb = new MemDB_(ScoredSheet.getData());
    
    for (var row = 0; row < Applications.length; row++) {
      
      var app_id = Applications[row]["Application ID"];
      var score = -1;
      var views = 0;
      var score_data = ScoredDb.clearFilters().addFilter({"Application ID":app_id}).getData();
      if (score_data.length == 1 && score_data[0].hasOwnProperty(User.Email)) score = score_data[0][User.Email];
      var views_data = ViewsDb.clearFilters().addFilter({"Application ID":app_id}).getData();
      if (views_data.length == 1 && views_data[0].hasOwnProperty(User.Email)) views = views_data[0][User.Email];
      
      Applications[row]["Your Score"] = score;
      Applications[row]["Viewed?"] = views;

    }
//    cache.put(cache_key, JSON.stringify(Applications), 21600);
    if (debug) Logger.log("getApplicationsDb(): applications found: " + Applications.length);
    return new MemDB_(Applications);
  }

  this.getDashboardColumns = function() {
    return ["Project Name",
                "Project Lead",
                "Rating", 
                "Category", 
                "Requested Amount",
                "Viewed?",
                "Questions",
                "Responses",
                "Should Fund",
                "Your Score",
                "Score",
                "Granted Amount"
           ];
  }
  
  this.getScoreboardColumns = function() {
    return [
              "Project Name",
              "Project Lead",
              "Rating", 
              "Category", 
              "Score",
              "Requested Amount",
              "Granted Amount"
           ];
  }
  
  this.getUser = function() { return User; } 

  this.cacheOff = function() { use_cache = false; }
  this.cacheOn = function() { use_cache = true; }
  this.debugOff = function() { debug = false; }
  this.debugOn = function() { debug = true; }
  
  this.clearCache = function() {
    var cache_keys = [];
    cache_keys.push("dash|" + User.Email);
    cache_keys.push("apps|" + User.Email);
    cache.remove(cache_keys);
    
  }
  
  this.getCategories = function() {
    return [
//      ["Effigy"],
//      ["Temple"],
      ["Stand-alone Installation"],
      ["Theme/Sound Camp"],
      ["Center Camp Installation"],
      ["Center Camp Workshop"],
      ["Performance Art"],
      ["Art Car / Mutant Vehicle"],
      ["Workshop"]
    ];
  }
  
  this.getDashboardDb = function() {
//    if (use_cache) {
//      var cache_key = "dash|" + User.Email;
//      var cached = cache.get(cache_key);
//      if (cached != null) {
//        if (debug) Logger.log("getDashboardDb(): cache hit");
//        return new MemDB_(JSON.parse(cached));
//      } else {
//        if (debug) Logger.log("getDashboardDb(): cache miss");
//      }
//    }
    
    openRobot();
    
    var ApplicationsSheet = new Sheet_(robot.getSheetByName("Applications")).cacheOff();
    var Applications = new MemDB_(ApplicationsSheet.getData()).addFilter({"Status":"Review"}).getData();

    if (debug) Logger.log("getDashboardDb(): applications found: " + Applications.length);
    var ViewsSheet = new Sheet_(robot.getSheetByName("Views")).cacheOff();
    var Views = new MemDB_(ViewsSheet.getData());
    var ScoredSheet = new Sheet_(robot.getSheetByName("Scored"));
    var Scored = new MemDB_(ScoredSheet.getData());
    
    for (var row = 0; row < Applications.length; row++) {
      
      var app_id = Applications[row]["Application ID"];
      var score = -1;
      var views = 0;
      var should_fund = -1;

      var App = new Application_(app_id);
//      App.clearCache("Score");
      var MyRankDb = App.getScoresDb();

      var my_rank_data = MyRankDb.clearFilters().addFilter({"Question ID":"O1"}).getData();
//      Logger.log("LENGTH: " + my_rank_data.length);
      Logger.log(JSON.stringify(my_rank_data));
      if (my_rank_data.length == 1 && my_rank_data[0].hasOwnProperty(User.Email)) should_fund = my_rank_data[0][User.Email];
      var score_data = Scored.clearFilters().addFilter({"Application ID":app_id}).getData();
      if (score_data.length == 1 && score_data[0].hasOwnProperty(User.Email)) score = score_data[0][User.Email];
      var views_data = Views.clearFilters().addFilter({"Application ID":app_id}).getData();
      if (views_data.length == 1 && views_data[0].hasOwnProperty(User.Email)) views = views_data[0][User.Email];
      
      Applications[row]["Your Score"] = score;
      Applications[row]["Viewed?"] = views;
      Applications[row]["Should Fund"] = should_fund;

    }

    var ApplicationsDb = new MemDB_(Applications);
    ApplicationsDb.addFilter({"CATS View":"Yes"}).addExclude({"Status":"Withdraw"});
//    cache.put(cache_key, JSON.stringify(Applications), 600);
    if (debug) Logger.log("getDashboardDb(): applications found: " + Applications.length);
    return new MemDB_(ApplicationsDb.getData());
  }
  
  this.getRatings = function() {
    return [
      ["G", "G - Family Friendly"],
      ["PG", "PG - A Little Risque"],
      ["R", "R - Potentially Offensive"],
      ["X", "X - Explicit"]
    ];
  }
  
  this.getRobot = function() { 
    openRobot();
    return robot;
  }
   
  this.getDashboardSheet = function() {
    openRobot();
    return robot.getSheetByName("Applications");
  }
  
  this.getUserSortField = function() {
    var cache_key = "sortfield|" + User.Email; 
    var cached = cache.get(cache_key);
    if (cached == null) cached = "Project Name";
    return cached;
  }
  
  this.setUserSortField = function(field) {
    var cache_key = "sortfield|" + User.Email; 
    cache.put(cache_key, field);
  }
  
  this.getUserSortDirection = function() {
    var cache_key = "sortdir|" + User.Email; 
    var cached = cache.get(cache_key);
    if (cached == null) cached = "A-Z";
    return ((cached == "Z-A") ? true : false);
  }

  this.setUserSortDirection = function(direction) {
    var cache_key = "sortdir|" + User.Email; 
    cache.put(cache_key, direction);
  }
  
  this.getViews = function() {
    var expire = 21600;
    var cache_key = "views";
    var cached = cache.get(cache_key);
    var data = [];
    if (!use_cache || cached == null) {
      if (debug) Logger.log("getViews(): cache miss");
      openRobot();
      var sheet = new Sheet_(robot.getSheetByName("Views"));
      data = sheet.getData();
      cache.put(cache_key, JSON.stringify(data), expire); 
    } else {
      data = JSON.parse(cached);      
    }
    if (debug) Logger.log("getViews(): data.length: " + data.length);
    return data;
  }

  this.getViewsDb = function() { 
    if (debug) Logger.log("getViewsDb()")
    if (views == undefined) views = new MemDB_(self.getViews()); 
    return views; 
  }
    
  this.syncApplication = function(Application) {
    if (debug) Logger.log("syncApplication(): application id: " + Application.getId());
    Application.clearCache();
    var lock = LockService.getScriptLock();
    openRobot();
    var DashboardSheet = new Sheet_(self.getDashboardSheet()).cacheOff();
//    DashboardSheet.getColumns(true);
    var DashboardDb = new MemDB_(DashboardSheet.getData());
    var robot = DashboardDb.addFilter({"Application ID":Application.getId()}).getData();
    if (robot.length < 1) throw new Error("Can't find application id: " + Application.getId());
    var robot_data = robot[0];

//    robot_data["Address"] = Application.getResponseValue("Address");
    robot_data["Application Final"] = Application.getConfigurationValue("Application Final");
    robot_data["Edit Open"] = Application.getConfigurationValue("Edit Open");
    robot_data["CATS View"] = Application.getConfigurationValue("CATS View");
    robot_data["Score"] = Application.getConfigurationValue("Score");
    robot_data["CATS Score Open"] = Application.getConfigurationValue("CATS Score Open");
    robot_data["CATS QnA Open"] = Application.getConfigurationValue("CATS QnA Open");
    robot_data["Status"] = Application.getConfigurationValue("Status");  
    robot_data["Project Name"] = Application.getResponseValue("ProjectName");
    robot_data["Project Lead"] = Application.getResponseValue("LegalName");
    robot_data["Alternate Name"] = Application.getResponseValue("AlternateName");
    robot_data["Project Lead Email"] = Application.getConfigurationValue("Email");
    robot_data["Category"] = Application.getResponseValue("Category");
    robot_data["Rating"] = Application.getResponseValue("Rating");
    robot_data["Generator"] = Application.getResponseValue("HasGenerator");
    robot_data["Fire/Fuel"] = Application.getResponseValue("HasFire");
    robot_data["Sound"] = Application.getResponseValue("HasSound");
    robot_data["Requested Amount"] = Application.getRequestedGrantAmount();
    robot_data["Value"] = Application.getGrantValue();
    robot_data["Application Url"] = Application.getConfigurationValue("Application Url");
    robot_data["Application Sheet Url"] = Application.getConfigurationValue("Application Sheet Url");
    robot_data["Edit Url"] = Application.getConfigurationValue("Edit Url");
    robot_data["Last Sync Date"] = new Date();
  
    var project_name = robot_data["Project Name"];
    if (project_name == "") project_name = robot_data["Project Lead Email"];
    
    Application.getApplication().rename(project_name + " (Application)");
        
    DriveApp.getFolderById(Application.getConfigurationValue("Application Directory ID")).setName(project_name);
    
    robot_data["Errors"] = Application.preFlight().length;
  
    lock.waitLock(properties.getProperty("lock_timeout"));
    DashboardSheet.updateRow("Application ID", Application.getId(), robot_data);
    lock.releaseLock();
    
    if (debug) Logger.log("Synced application id: " + Application.getId());
    
  }
  
  return this;
}

Robot_.prototype = { constructor: Robot_ }

//function GetFiles_(folder, label) {
//  var files = [];
//  var root;
//  if (label == undefined) {
//    label = "";
//    root = true;
//  } else { 
//    root = false;
//  }
//  
//  var new_files = folder.getFiles();
//  while (new_files.hasNext()) {
//    var file = new_files.next();
//    var new_file = {};
//    new_file["File ID"] = file.getId();
//    new_file["File name"] = file.getName();
//    new_file["Path"] = label;
//    new_file["Date"] = file.getDateCreated();
//    new_file["Content Type"] = file.getBlob().getContentType();
//    new_file["URL"] = file.getUrl();
//    files.unshift(new_file);
//  }
//  
//  var sub_folders = folder.getFolders();
//  while (sub_folders.hasNext()) {
//    var sub_folder = sub_folders.next();
//    if (root) label = sub_folder.getName();
//    var sub_files = GetFiles_(sub_folder, label);
//    for (var i = 0; i < sub_files.length; i++) {
//      files.push(sub_files[i]);      
//    }
//  }
//  return files;
//}

function FileList_(ui, Application, options) {

  var properties = PropertiesService.getScriptProperties();  
  if (options == undefined) options = {}; 
  if (typeof(options["showDelete"]) == 'undefined') options.showDelete = true;
  if (typeof(options["width"]) == 'undefined') options.width = 150;
  if (typeof(options["height"]) == 'undefined') options.height = 150;

  var app_id = Application.getId();  
  
  var FileListParent = ui.getElementById("FilesList");
  var FileListPanel = Panel_(ui, css.indent);
  var FileListSection = Section_(ui, "Project images / files ").add(FileListPanel);

  FileListParent.clear();
  FileListParent.add(FileListSection);
  
  if (!User_().isIgnition) {
    FileListParent.add(Paragraph_(ui, Label_(ui, "Although not required, we highly recommend you upload at least a sketch of your idea.  Instructions for uploading files to your application are in the 'Upload images/files' section below. " + 
                                               "This can be very simple, like a sketch on a napkin kind of thing.  A picture truly is worth a thousand words."))).add(Spacer_(ui));  
  }
  
  var db = new MemDB_(Application.getFiles());
    
  if (db.getData().length == 0) {
   
    FileListParent.add(Paragraph_(ui, Label_(ui, "No files have been uploaded.", css.label, css.bold)));
  
  } else {
  
    var FormGrid = ui.createFlexTable().setId("FormGrid").setStyleAttributes(css.imagecontainerpanel).setVisible(false);
    var FilesTree = ui.createTree().setAnimationEnabled(true).setVisible(false).setStyleAttributes(css.shimbottom);
    var file_col = 0; 
    var file_row = 0 ;  
    
    FileListPanel.add(FormGrid);
    FileListPanel.add(FilesTree);
    
    var file_data = db.clearFilters().addFilter({Path:""}).getData();
    
    if (file_data.length > 0) FormGrid.setVisible(true);
    
    for (var i = 0; i < file_data.length; i++) {
      var img;
      var FilesTable = Panel_(ui, css.imagepanel).setVerticalAlignment(UiApp.VerticalAlignment.TOP).setHorizontalAlignment(UiApp.HorizontalAlignment.CENTER);
      var FileDeleteHandler = ui.createServerHandler("FileDeleteHandler_");
      var FileViewHandler = ui.createServerHandler("FileViewHandler_");
  
      FilesTable.add(Label_(ui, file_data[i]["File name"], css.label, css.bold));

      if (file_data[i]["Content Type"].match(/image/gi)) img = Image_(ui, DriveImgUrl_(file_data[i]["File ID"]), options.width, options.height);
      else img = Image_(ui, DriveImgUrl_(properties.getProperty("file_icon_id")), options.width, options.height);
      
      FilesTable.add(img);
  
  //    var FileView = Button_(ui, "FileView", "View", FileViewHandler, css.buttonblue, css.buttonbluehover);
      var FileView = AnchorButton_(ui, "FileView", "Open", file_data[i]["URL"]);
      FileView.addClickHandler(FileViewHandler);
      FileViewHandler.addCallbackElement(FileView)
                       .addCallbackElement(Hidden_(ui, "app_id", app_id))
                       .addCallbackElement(Hidden_(ui, "file_id", file_data[i]["File ID"])); 
  
      var FileDelete = Button_(ui, "FileDelete", "Delete", FileDeleteHandler, css.buttonred, css.buttonredhover);
      FileDelete.addClickHandler(FileDeleteHandler);
      FileDelete.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setText("Deleting...").setStyleAttributes(css.buttonreddisabled));
      
      FilesTable.add(HPanel_(ui, css.hpanel, css.shimtop, css.shimbottom).add(FileView).add(FileDelete));
      var show_delete = false; 
      if (options.showDelete && (file_data[i]["Import Source"] == "HTML" || file_data[i]["Import Source"] == "URL")) show_delete = true;
      FileDelete.setVisible(show_delete);
      FileDeleteHandler.addCallbackElement(FileDelete)
                       .addCallbackElement(Hidden_(ui, "app_id", app_id))
                       .addCallbackElement(Hidden_(ui, "file_id", file_data[i]["File ID"])); 
  
      
      FormGrid.setWidget(file_row, file_col, FilesTable);
      FormGrid.setStyleAttributes(file_row, file_col, {width:"25%", margin:"10px"});
      file_col++;
      if (file_col >= 4) {
        file_row++;
        file_col = 0;
      }
    }
  
    var path = "";
    var tree_item;
    var tree_panel;
    file_col = 0;
    file_row = 0;
    
    file_data = db.clearFilters().addExclude({Path:""}).getData();

    if (file_data.length > 0) FilesTree.setVisible(true);
    
    for (var i = 0; i < file_data.length; i++) {
  
      var img;
      var FilesTable = Panel_(ui, css.imagepanel).setVerticalAlignment(UiApp.VerticalAlignment.TOP).setHorizontalAlignment(UiApp.HorizontalAlignment.CENTER);
      var FileDeleteHandler = ui.createServerHandler("FileDeleteHandler_");
      var FileViewHandler = ui.createServerHandler("FileViewHandler_");
      
      if (file_data[i]["Content Type"].match(/image/gi)) img = Image_(ui, DriveImgUrl_(file_data[i]["File ID"]), options.width, options.height);
      else img = Image_(ui, DriveImgUrl_(properties.getProperty("file_icon_id")), options.width, options.height);
      
      FilesTable.add(img);
      var FileView = AnchorButton_(ui, "FileView", "View", file_data[i]["URL"]);
      FileView.addClickHandler(FileViewHandler);
      
      var FileDelete = Button_(ui, "FileDelete", "Delete", FileDeleteHandler, css.buttonred, css.buttonredhover);
      FileDelete.addClickHandler(FileDeleteHandler);
      FileDelete.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setText("Deleting...").setStyleAttributes(css.buttonreddisabled));
      
      FilesTable.add(Anchor_(ui, file_data[i]["File name"], file_data[i]["URL"], css.bold));
      FilesTable.add(HPanel_(ui, css.hpanel, css.shimtop, css.shimbottom).add(FileView).add(FileDelete));
      FileDelete.setVisible(options.showDelete);
      FileDeleteHandler.addCallbackElement(FileDelete)
      .addCallbackElement(Hidden_(ui, "app_id", app_id))
      .addCallbackElement(Hidden_(ui, "file_id", file_data[i]["File ID"])); 
      
      if (path != file_data[i]["Path"]) {
        path = file_data[i]["Path"];
        tree_item = ui.createTreeItem(Label_(ui, path, css.filetreelabel)).setStyleAttributes(css.filetreebackground).setWidth("100%");
        tree_panel = ui.createFlexTable().setId(path).setStyleAttributes(css.imagecontainerpanel);
        tree_item.addItem(tree_panel);
        FilesTree.addItem(tree_item);
        file_col = 0;
        file_row = 0;
      }
      
      tree_panel.setWidget(file_row, file_col, FilesTable);
      
      file_col++;
      if (file_col >= 4) {
        file_row++;
        file_col = 0;
      }
      
    }
  }
  
  return FileListSection;

}

function FileUploaderForm_(ui, Application) {
  var properties = PropertiesService.getScriptProperties();  
  var UploaderSection = Section_(ui, "Add images / files to your application");
  var FileUploaderPanel = Panel_(ui);

  var RefreshHandler = ui.createServerHandler("RefreshFilesHandler_");
  RefreshHandler.addCallbackElement(Hidden_(ui, "aid", Application.getId()));

  var RemoveHandler = ui.createServerHandler("RemoveFilesHandler_");
  RemoveHandler.addCallbackElement(Hidden_(ui, "aid", Application.getId()));

  var UploadMethod = Listbox_(ui, "UploadMethod", "URL", [["URL"], ["Google Drive"], ["Non-Google Upload"]]);
  FileUploaderPanel.add(HPanel_(ui).add(Label_(ui, "Upload using: ", css.label, css.bold)).add(UploadMethod)); 

  var RefreshButton = Button_(ui, "RefreshFileList", "Add files to application", RefreshHandler, css.buttonblue, css.buttonbluehover);
  RefreshButton.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setText("Adding files...").setStyleAttributes(css.buttonbluedisabled));

  var RemoveButton = Button_(ui, "RemoveFileList", "Remove files from application", RemoveHandler, css.buttonred, css.buttonredhover);
  RemoveButton.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setText("Removing files...").setStyleAttributes(css.buttonreddisabled));

  var UrlPanel = Panel_(ui).setId("UrlPanel").setVisible(true);
  UrlPanel.add(Urlify_(ui, "Providing a URL to your file will likely be the easiest and fastest way to add files to your application.  You can provide a URL to an image file (eg. PNG, JPEG, GIF), a PDF, or other raw file.  You should open the uploaded file to ensure it was processed correctly.  For example: http://apogaea.com/wp-content/uploads/2010/01/3_GrantRounds.png"));
  var UrlTextBox = TextBox_(ui, "FileUrl").setStyleAttributes(css.textboxwide).setStyleAttributes(css.halfwidth);
  
  var AddFileButtonHandler = ui.createServerClickHandler("AddFileButtonHandler_");
  var AddFileButton = Button_(ui, "FileUrlSubmit", "Add file", AddFileButtonHandler, css.buttonblue, css.buttonbluehover);
  AddFileButtonHandler.addCallbackElement(UrlTextBox).addCallbackElement(AddFileButton)
  .addCallbackElement(Hidden_(ui, "aid", Application.getId()));

  AddFileButton.addClickHandler(ui.createClientHandler().forEventSource().setStyleAttributes(css.buttonbluedisabled).setEnabled(false).setText("Adding file..."));
  UrlPanel.add(Panel_(ui)
                       .add(Question_(ui, UrlTextBox, "Enter the URL to the file", ""))
                       .add(AddFileButton)
                      );
  
  var GoogleDrivePanel = Panel_(ui).setId("GoogleDrivePanel").setVisible(false);
  GoogleDrivePanel.add(Label_(ui, "If you do not have a means of providing a public URL to your file(s), using Google Drive to upload your files will likely be faster than the non-Google method, especially for large files, but it requires a Google account.  " + 
                                  "If you have one, use this option.  After uploading or deleting files in Google Drive, refresh this page to see your changes."));
  GoogleDrivePanel.add(Spacer_(ui));
  GoogleDrivePanel.add(Spacer_(ui));
  GoogleDrivePanel.add(Spacer_(ui));
  GoogleDrivePanel.add(Panel_(ui)
                       .add(Label_(ui, "Begin by adding the upload folder to your Google Drive (you should only have to do this once): ", css.label, css.bold))
                       .add(Spacer_(ui))
                       .add(HPanel_(ui, css.hpanel, css.shimbottom).setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE)
                              .add(Label_(ui, "1. ", css.label, css.shimright))
                              .add(AnchorButton_(ui, "GoogleDriveMethod", "Open upload folder", Application.getConfigurationValue("Files Directory Url")))
                             )
                       .add(Label_(ui, "2. In the new window that opens, click the 'Add to Drive' button in the top right.", css.label, css.shimright, css.shimbottom))
                      );
  GoogleDrivePanel.add(Spacer_(ui));
  GoogleDrivePanel.add(Spacer_(ui));
  GoogleDrivePanel.add(Spacer_(ui));
  GoogleDrivePanel.add(Panel_(ui)
                       .add(Label_(ui, "Add files to your application: ", css.label, css.bold))
                       .add(Spacer_(ui))
                       .add(HPanel_(ui, css.hpanel, css.shimbottom).setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE)
                              .add(Label_(ui, "1. ", css.label, css.shimright))
                              .add(AnchorButton_(ui, "GoogleDriveMethod", "Open upload folder", Application.getConfigurationValue("Files Directory Url")))
                             )
                       .add(Label_(ui, "2. In the new window, click the blue 'Open in Drive' button on the top right.", css.label, css.shimright, css.shimbottom))
                       .add(Label_(ui, "3. Add files to the directory using the Google Drive interface.", css.label, css.shimright, css.shimbottom))
                         .add(HPanel_(ui, css.hpanel, css.shimbottom).setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE)
                              .add(Label_(ui, "4. ", css.label, css.shimright))
                             .add(RefreshButton)
                              )
                      );

  GoogleDrivePanel.add(Spacer_(ui));
  GoogleDrivePanel.add(Spacer_(ui));
  GoogleDrivePanel.add(Spacer_(ui));
  GoogleDrivePanel.add(Panel_(ui)
                       .add(Label_(ui, "Remove files from your application: ", css.label, css.bold))
                       .add(Spacer_(ui))
                       .add(HPanel_(ui, css.hpanel, css.shimbottom).setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE)
                              .add(Label_(ui, "1. ", css.label, css.shimright))
                              .add(AnchorButton_(ui, "GoogleDriveMethod", "Open upload folder", Application.getConfigurationValue("Files Directory Url")))
                             )
                       .add(Label_(ui, "2. In the new window, click the blue 'Open in Drive' button on the top right.", css.label, css.shimright, css.shimbottom))
                       .add(Label_(ui, "3. Remove files from the directory using the Google Drive interface.", css.label, css.shimright, css.shimbottom))
                         .add(HPanel_(ui, css.hpanel, css.shimbottom).setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE)
                              .add(Label_(ui, "4. ", css.label, css.shimright))
                              .add(RemoveButton)
                              )
                      );


  
  var HTMLPanel = Panel_(ui).setId("HTMLPanel").setVisible(false);
  HTMLPanel.add(Label_(ui, "If you aren't using Google Drive to upload your files, you can use the form below to upload " + 
      "files that are less than 10MB or so.  Follow these instructions:"));
  HTMLPanel.add(Spacer_(ui));
  HTMLPanel.add(HTML_(ui,       
                      "<ol>" + 
                      "<li>Click the 'Choose File' button to select a file from your computer</li>" + 
                      "<li>Select the file</li>" + 
                      "<li>Click the 'Upload File' button</li>" + 
                      "<li>Wait while the file uploads.  Depending on the file's size and your connection speed, it " + 
                      "can take several minutes to upload.</li>" + 
                      "<li>If you are having trouble uploading files, use the help email listed in the Instructions section at the top of your grant application</li>" + 
                      "</ol>",
                     css.label, css.shimtop));

  UploadMethod.addChangeHandler(ui.createClientHandler().validateMatches(UploadMethod, "URL").forTargets(UrlPanel).setVisible(true).forTargets(HTMLPanel, GoogleDrivePanel).setVisible(false));
  UploadMethod.addChangeHandler(ui.createClientHandler().validateMatches(UploadMethod, "Google Drive").forTargets(GoogleDrivePanel).setVisible(true).forTargets(HTMLPanel, UrlPanel).setVisible(false));
  UploadMethod.addChangeHandler(ui.createClientHandler().validateMatches(UploadMethod, "Non-Google Upload").forTargets(HTMLPanel).setVisible(true).forTargets(GoogleDrivePanel, UrlPanel).setVisible(false));
  
//  var HTMLFormPanel = HPanel_(ui).setId("FormPanel").setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE);
  var HTMLFormPanel = Paragraph_(ui, HPanel_(ui).setId("FileUploaderFormPanel"));
  FileUploaderFormPanel_(ui, Application);
  FileUploaderPanel.add(Spacer_(ui));
  UploaderSection.add(Paragraph_(ui, FileUploaderPanel));
  FileUploaderPanel.add(UrlPanel);
  FileUploaderPanel.add(GoogleDrivePanel);
  FileUploaderPanel.add(HTMLPanel);
  
  return UploaderSection;
  
}

function AddFileButtonHandler_(e) {
  var ui = UiApp.getActiveApplication();
  var app_id = e.parameter.aid;
  var url = Trim_(e.parameter.FileUrl);

  var response = UrlFetchApp.fetch(url);
 
  if (response.getResponseCode() == "200") {

    var file_blob = response.getBlob();
    var Application = new Application_(app_id);
    var files_sheet = new Sheet_(Application.getApplication().getSheetByName("Files"));
    var file = DriveApp.createFile(file_blob);
    var files_directory_id = Application.getConfigurationValue("Files Directory ID");
    var file_dir = DriveApp.getFolderById(files_directory_id);
    file_dir.addFile(file);

    var file_parents = file.getParents();
    while (file_parents.hasNext()) {
      var folder = file_parents.next();
      if (folder.getId() != files_directory_id) {
        folder.removeFile(file); 
      }
    }
    
    var updateData = {};

    if (file_blob.getContentType().match(/^image/)) {
      updateData["Content Type"] = "image";
    } else {
      updateData["Content Type"] = "other";
    }
    updateData["Date"] = file.getDateCreated();
    updateData["File ID"] = file.getId();
    updateData["File name"] = file.getName();
    updateData["URL"] = file.getUrl();
    updateData["Path"] = "";
    updateData["Import Source"] = "URL";
  
    files_sheet.insertRow(updateData);

    
  }
  
  ui.getElementById("FileUrlSubmit").setEnabled(true).setText("Add file").setStyleAttributes(css.buttonblue);
  ui.getElementById("FileUrl").setText("");
  
  FileList_(ui, Application);
  return ui;
}

function FileUploaderFormPanel_(ui, Application) {
  var HTMLPanel = ui.getElementById("HTMLPanel");
  var HTMLFormPanel = ui.getElementById("FileUploaderFormPanel");
  HTMLFormPanel.clear();
  var ServerHandler = ui.createServerHandler("UploaderHandler_");
  ServerHandler.addCallbackElement(ui.createHidden("aid", Application.getId()));
  var form = ui.createFormPanel();
  form.addSubmitCompleteHandler(ServerHandler);
  var FileUpload = ui.createFileUpload().setName("theFile");
  var SubmitButton = ui.createSubmitButton("Upload File").setEnabled(true).setVisible(false).setStyleAttributes(css.paragraph).setStyleAttributes(css.button).setStyleAttributes(css.buttonred);
  FileUpload.addChangeHandler(ui.createClientHandler().forTargets(SubmitButton).setVisible(true));
  var UploaderMsg  = Label_(ui, "", css.bold, css.shimbottom).setId("UploaderMsg").setVisible(false);
  SubmitButton.addClickHandler(ui.createClientHandler().forEventSource().setVisible(false));
  SubmitButton.addClickHandler(ui.createClientHandler().forTargets(SubmitButton).setVisible(true).setText("Uploading file...").setStyleAttributes(css.buttonreddisabled));
  HTMLFormPanel.add(FileUpload);
  HTMLFormPanel.add(SubmitButton);
  HTMLFormPanel.add(ui.createHidden("aid", Application.getId()));
  HTMLFormPanel.add(ui.createHidden("fid", Application.getConfigurationValue("Files Directory ID")));
  form.add(HTMLFormPanel);
  HTMLPanel.add(form);
  HTMLPanel.add(UploaderMsg);
  ServerHandler.addCallbackElement(UploaderMsg);
}

function FileViewHandler_(e) {
  var ui = UiApp.getActiveApplication();
  var app_id = e.parameter.app_id;
  var file_id = e.parameter.file_id;
  return ui;  
}

function FileDeleteHandler_(e) {
  var ui = UiApp.getActiveApplication();
  var app_id = e.parameter.app_id;
  var file_id = e.parameter.file_id;
  DriveApp.getFileById(file_id).setTrashed(true);
//  DocsList.getFileById(file_id).setTrashed(true);
  var Application = new Application_(app_id);
  var files_sheet = new Sheet_(Application.getApplication().getSheetByName("Files"));
  files_sheet.deleteRow("File ID", file_id);
//  files_sheet.getData(true);
//  Application.clearCache("Files");
  FileList_(ui, Application);
  return ui;
}

function RefreshFilesHandler_(e) {
  var ui = UiApp.getActiveApplication();
  var app_id = e.parameter.aid;
  var Application = new Application_(app_id);
  Application.updateFiles();
//  Application.clearCache("Files");
  FileList_(ui, Application);
  ui.getElementById("RefreshFileList").setEnabled(true).setText("Add files to application").setStyleAttributes(css.buttonblue);
  return ui;
}

function RemoveFilesHandler_(e) {
  var ui = UiApp.getActiveApplication();
  var app_id = e.parameter.aid;
  var Application = new Application_(app_id);
  Application.updateFiles();
//  Application.clearCache("Files");
  FileList_(ui, Application);
  ui.getElementById("RemoveFileList").setEnabled(true).setText("Remove files from application").setStyleAttributes(css.buttonred);
  return ui;
}

function UploaderHandler_(e) {
  var ui = UiApp.getActiveApplication();
  var app_id = e.parameter.aid;
  var Application = new Application_(app_id);
  Application.updateFiles();
//  Application.clearCache("Files");
  FileList_(ui, Application);
  FileUploaderFormPanel_(ui, Application);
  return ui;
}

function FileUploaderHandler_(e) {
  var fileBlob = e.parameter.theFile;
  var fid = e.parameter.fid;
  var aid = e.parameter.aid;
  
  var folder = DriveApp.getFolderById(fid);
  var doc = folder.createFile(fileBlob);
  
  var Application = new Application_(aid);
  var files_sheet = new Sheet_(Application.getApplication().getSheetByName("Files"));

  var updateData = {};

  if (fileBlob.getContentType().match(/^image/)) {
    updateData["Content Type"] = "image";
  } else {
    updateData["Content Type"] = "other";
  }
  updateData["Date"] = doc.getDateCreated();
  updateData["File ID"] = doc.getId();
  updateData["File name"] = doc.getName();
  updateData["URL"] = doc.getUrl();
  updateData["Path"] = "";
  updateData["Import Source"] = "HTML";
  
  files_sheet.insertRow(updateData);
//  files_sheet.getData(true);
}

var BORDER_WIDTH = 0;

function Anchor_(ui, text, url) {
  var widget = ui.createAnchor(text, true, url)
  var length = arguments.length;
  if (length == 3) widget.setStyleAttributes(css.label);
  widget.addMouseOverHandler(ui.createClientHandler().forEventSource().setStyleAttributes(css.anchorhover))
        .addMouseOutHandler(ui.createClientHandler().forEventSource().setStyleAttributes(css.anchor));
  for (var i = 3; i < length; i++) widget.setStyleAttributes(arguments[i]);
  widget.setStyleAttributes(css.anchor);
  return widget;
}

function AnchorButton_(ui, name, label, url) {
  if (ui == undefined) throw new Error("Button_() requires a ui object");
  if (label == undefined) throw new Error("Button_() requires a label");
  if (name == undefined) throw new Error("Button_() requires a name");
  var widget = ui.createAnchor(label, false, url).setStyleAttributes(css.anchorbutton);
  widget.addMouseOverHandler(ui.createClientHandler().forEventSource().setStyleAttributes(css.anchorbuttonhover))
        .addMouseOutHandler(ui.createClientHandler().forEventSource().setStyleAttributes(css.anchorbutton));
  return widget;
}

function Button_(ui, name, label, handler, enabled_style, hover_style) {
  if (ui == undefined) throw new Error("Button_() requires a ui object");
  if (label == undefined) throw new Error("Button_() requires a label");
  if (name == undefined) throw new Error("Button_() requires a name");
  if (handler == undefined) throw new Error("Button_() requires a handler");
  var button = ui.createButton(label, handler).setId(name).setStyleAttributes(css.button).setStyleAttributes(enabled_style);
  button.addMouseOverHandler(ui.createClientHandler().forEventSource().setStyleAttributes(hover_style));
  button.addMouseOutHandler(ui.createClientHandler().forEventSource().setStyleAttributes(enabled_style));
  return button;
}

function Checkbox_(ui, name, checked, handler) {
  if (ui == undefined) throw new Error("Checkbox_() requires a ui object");
  if (name == undefined) throw new Error("Checkbox_() requires a name");
  if (checked == undefined) checked = false;

  var box = ui.createCheckBox()
               .setId(name)
               .setName(name)
               .setValue(checked)
               .setStyleAttributes(
                 {
                   "margin-bottom": "5px"
                 }
               );
  if (handler != undefined) box.addValueChangeHandler(handler);
  
  return box;

}

function Content_(ui) {
  return Panel_(ui, css.content); 
}

function ErrorLabel_(ui, id, label) {
  if (ui == undefined) throw new Error("ErrorLabel_() requires a ui object");
  if (id == undefined) throw new Error("ErrorLabel_() requires an id");
  if (label == undefined) throw new Error("ErrorLabel_() requires a label");
  return Label_(ui, label, css.errorlabel).setId(id).setVisible(false);
}

function ErrorUi_(err_msg) {
  if (err_msg == undefined) throw new Error("ErrorUi_() requires a message");

  Logger.log("+=+=+=+=+=+=+=+=+=+=+=+=+=+=");
  Logger.log("+=+=+=+=+=+=+=+=+=+=+=+=+=+=");
  Logger.log("+=+=+=+=+=+=+=+=+=+=+=+=+=+=");
  Logger.log("+=+=+=+=+=+=+=+=+=+=+=+=+=+=");
  Logger.log("ERROR MESSAGE: " + err_msg);
  Logger.log("+=+=+=+=+=+=+=+=+=+=+=+=+=+=");
  Logger.log("+=+=+=+=+=+=+=+=+=+=+=+=+=+=");
  Logger.log("+=+=+=+=+=+=+=+=+=+=+=+=+=+=");
  Logger.log("+=+=+=+=+=+=+=+=+=+=+=+=+=+=");

  var properties = PropertiesService.getScriptProperties();
  var ui = Ui_(properties, "Oh Noes!!1!");
  var panel = Content_(ui);

  panel.add(
    HPanel_(ui)
      .add(ui.createImage(ApoLogoUrl_(properties)).setPixelSize(100, 60).setStyleAttributes(css.image))
      .add(ui.createImage(CatsLogoUrl_(properties)).setPixelSize(60, 60).setStyleAttributes(css.image))
  );

  panel.add(Label_(ui, "Something went wrong:", css.headerlabel));
  panel.add(Label_(ui, err_msg, css.errorlabellarge, css.indent, css.shimbottom));
  panel.add(Footer_(ui, properties));
  ui.add(panel);
  return ui;
}

function Footer_(ui, properties) {
  if (ui == undefined) throw new Error("Footer_() requires a ui object");
  if (properties == undefined) throw new Error("Footer_() requires a properties object");
  return Panel_(ui)
                  .add(Label_(ui, "Help!?!", css.headerlabel))
                  .add(Paragraph_(ui, Panel_(ui)
                         .add(Urlify_(ui, "Need help?  Email " + properties.getProperty("help_email") + " for assistance!", css.label, css.bold))
                         .add(Image_(ui, CatsMascotUrl_(properties), 281, 300))
               ));
}

function FormPanel_(ui, style) {
  if (ui == undefined) throw new Error("Panel_() requires ui object");
  var widget = ui.createFormPanel().setBorderWidth(BORDER_WIDTH);
  for (var i = 1; i < arguments.length; i++) widget.setStyleAttributes(arguments[i]);
  if (style == undefined) widget.setStyleAttributes(css.panel);
  return widget;
}

function Header_(ui, properties, default_header_text) {
  if (ui == undefined) throw new Error("Header_() requires ui object");
  if (properties == undefined) throw new Error("Header_() requires properties object");
    
  var panel = Panel_(ui);
  var quote = Quote_();
  
  if (default_header_text == undefined) default_header_text = "Apogaea " + properties.getProperty("round_name") + " Grant Application";
  
  panel.add(
    HPanel_(ui)
      .add(Image_(ui, ApoLogoUrl_(properties), 100, 60))
      .add(Image_(ui, CatsLogoUrl_(properties), 49, 60))
      .add(Panel_(ui)
            .add(Label_(ui, default_header_text, css.pagetitle))
            .add(Label_(ui, quote["quote"], css.quote))
            .add(Label_(ui, "-- " + quote["source"], css.quote))
    )
  );
  
  panel.add(Section_(ui, properties.getProperty("round_name") + " Details"));

  var content = Panel_(ui);
  content.add(Label_(ui, "Important things:", css.label, css.bold, css.shimbottom));
  content.add(HTML_(ui, UL_([
                            "You must submit your application using this form.  Applications will not be accepted via email.",
                            "If things aren't working, try refreshing the page",
                            "Funds available: " + Currency_(Number(properties.getProperty("round_funds")) + Number(properties.getProperty("extra_funds"))),
                            "Grants can be for any amount up to: " + Currency_(properties.getProperty("round_max_grant")),
                            "Application window opens / Begin accepting applications: " + FormatDate_(properties.getProperty("application_open_date")),
                            "Application window closes / Applications complete and error free: " + FormatExactDate_(properties.getProperty("application_deadline_date")),
                            "CATS review / Applicant question and answer: " + FormatDate_(properties.getProperty("cats_review_begin_date")) + " - " + FormatDate_(properties.getProperty("cats_review_end_date")),
                            "Applications final (Applicant can no longer edit the application): " + FormatExactDate_(properties.getProperty("applications_final_date")),
                            "CATS scoring: " + FormatDate_(properties.getProperty("cats_score_begin_date")) + " - " + FormatExactDate_(properties.getProperty("cats_score_end_date")),
                            "CATS grant selection meeting: " + FormatDate_(properties.getProperty("funding_meeting_date")),
                            "Results sent to applicants: On or around " + FormatDate_(properties.getProperty("applicants_notified_date")),
                            "BOD / Finance Committee review: " + FormatDate_(properties.getProperty("bod_fc_review_begin_date")) + " - " + FormatDate_(properties.getProperty("bod_fc_review_end_date")),
                            "Signed grant agreement (the contract) due by: " + FormatExactDate_(properties.getProperty("contract_due_date")),
                            "Disbursement process begins / Checks in the mail: On or around " + FormatDate_(properties.getProperty("disbursements_begin_date"))
                          ])
                  ));

//  var extra_content = Panel_(ui);
  content.add(Anchor_(ui, "Need help or have questions regarding the grant process?  Email the Grant Robot for assistance!", "mailto:" + properties.getProperty("help_email"), css.label, css.bold, css.anchor));
  content.add(Anchor_(ui, "Apogaea 2015 Grant Information", properties.getProperty("website_url")));
  content.add(Anchor_(ui, "Apogaea Grant Frequently Asked Questions", properties.getProperty("website_url") + "#FAQ"));
  content.add(Anchor_(ui, "What's going on with all this \"safety\" crap?!?", "http://apogaea.com/2014/01/15/apogaea-2014-and-safety/"));
  content.add(Anchor_(ui, "Examples of applications awarded grants in the past", "http://apogaea.com/art-installations/creativegrants/#Ques19"));
  content.add(Anchor_(ui, "How are grants scored and selected?", "http://apogaea.com/art-installations/creativegrants/#Ques17"));
  
  //  content.add(extra_content);
  panel.add(Paragraph_(ui, content));
  
  return panel;
}

function Hidden_(ui, name, value) { 
  return ui.createHidden(name, value);
}

function HPanel_(ui, style) {
  if (ui == undefined) throw new Error("HPanel_() requires ui object");
  var widget = ui.createHorizontalPanel().setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE).setBorderWidth(BORDER_WIDTH);
  for (var i = 1; i < arguments.length; i++) widget.setStyleAttributes(arguments[i]);
  if (style == undefined) widget.setStyleAttributes(css.hpanel);
  return widget;
}

function HR_() {
  return '<hr style="border-style:dashed;border-width:1">';
}

function HTML_(ui, label) {
  if (ui == undefined) throw new Error("HTML_() requires a ui object");
  if (label == undefined) throw new Error("HTML_() requires a label");
  var widget = ui.createHTML(label);
  var length = arguments.length;
  if (length == 2) widget.setStyleAttributes(css.label);
  else for (var i = 2; i < length; i++) widget.setStyleAttributes(arguments[i]);
  return widget;
}

function Image_(ui, url, w, h, style) {
  var widget = ui.createImage(url).setPixelSize(w, h);
  for (var i = 4; i < arguments.length; i++) widget.setStyleAttributes(arguments[i]);
  if (style == undefined) widget.setStyleAttributes(css.image);
  return widget;
}

function Indent_(widget) {
  widget.setStyleAttributes(css.indent);
  return widget;
}

function Label_(ui, label) {
  if (ui == undefined) throw new Error("Label_() requires a ui object");
  if (label == undefined) throw new Error("Label_() requires a label");
  var widget = ui.createLabel(label);
  var length = arguments.length;
  if (length == 2) widget.setStyleAttributes(css.label);
  else for (var i = 2; i < length; i++) widget.setStyleAttributes(arguments[i]);
  return widget;
}

function Listbox_(ui, name, selected_value, values, style) {
  if (ui == undefined) throw new Error("Listbox_() requires a ui object");
  if (name == undefined) throw new Error("Listbox_() requires a name");
  if (values == undefined) throw new Error("Listbox_() requires values");
  if (style == undefined) style = css.listbox;

  if (selected_value == undefined) selected_value = "";
  
  var Listbox = ui.createListBox().setName(name).setId(name).setStyleAttributes(style);
  for (var i = 0; i < values.length; i++) {
    var text = values[i][1];
    var value = values[i][0];
    if (text == undefined) text = value;
    Listbox.addItem(text, value);
    if (value == selected_value) Listbox.setItemSelected(i, true);
  }
  for (var i = 5; i < arguments.length; i++) Listbox.setStyleAttributes(arguments[i]);
  return Listbox;
}

function Panel_(ui) {
  if (ui == undefined) throw new Error("Panel_() requires ui object");
  var widget = ui.createVerticalPanel().setBorderWidth(BORDER_WIDTH);
  var length = arguments.length;
  if (length == 1) widget.setStyleAttributes(css.panel);
  else for (var i = 1; i < arguments.length; i++) widget.setStyleAttributes(arguments[i]);
  return widget;
}

function Paragraph_(ui, widget) {
  return Panel_(ui, css.panel, css.indent).add(Panel_(ui, css.indentedparagraph).add(widget)); 
}

function Question_(ui, widget, question, hint) {
  if (ui == undefined) throw new Error("Question_() requires a ui object");
  if (widget == undefined) throw new Error("Question_() requires a widget");
  if (question == undefined) throw new Error("Question_() requires a question");
  var Panel = Panel_(ui, css.question).setId(widget.getId() + "ErrorPanel");
  Panel.add(Label_(ui, question, css.questionheader));
  if (hint != undefined && hint != null && hint != "") Panel.add(Label_(ui, hint, css.hint)); 
  Panel.add(ErrorLabel_(ui, widget.getId() + "Error", "There is an error with this question", css.errorlabel));
  Panel.add(widget);
  return Panel;
}

function Radio_(ui, name, values) {
  if (ui == undefined) throw new Error("Radio_() requires a ui object");
  if (name == undefined) throw new Error("Radio_() requires a name");
  if (values == undefined) throw new Error("Radio_() requires values");

  var Panel = ui.createVerticalPanel().setStyleAttributes({
    "width": "100%"
  });

  for (var i = 0; i < values.length; i++) {
    Panel.add(ui.createVerticalPanel().setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE).add(
                      ui.createRadioButton(name, values[i][1])
                   .setId(values[i][0])
                   .setName(values[i][0])
                   .setStyleAttributes(
                     {
                       "margin-bottom": "5px"
                     }
                   )
                 )
              )
              ;
  }
  
  return Panel;

}

function RequireSheet_(sheet, sheet_name) {
  if (sheet == undefined) throw new Error("RequireSheet_() requires a sheet");
  if (sheet_name == undefined) throw new Error("RequireSheet_() requires a sheet name");
  if (sheet.getName() != sheet_name) {
    throw new Error("You must switch to the sheet '" + sheet_name + "' before running this script.");
    return false;
  } else {
    return true;
  }
}

function Section_(ui, msg) {
  if (ui == undefined) throw new Error("Section_() requires ui object");
  return Panel_(ui).add(
    Label_(ui, msg, css.headerlabel)
  );
}

function SelectedRowRange_(ss) {
  if (ss == undefined) throw new Error("SelectedRowRange_() requires a spreadsheet");

  var selected_range = ss.getActiveRange();
  if (selected_range == undefined || selected_range.getNumRows() != 1) {
    throw new Error("You must select one row."); 
    return;
  }
  
  var row_range = ss.getActiveSheet().getRange(selected_range.getRow(), 1, 1, ss.getLastColumn());
  if (row_range == undefined || row_range.getNumRows() != 1) {
    throw new Error("You must select one row."); 
    return;
  }
  
  return row_range;

}

function SelectedRowsRange_(ss) {
  if (ss == undefined) throw new Error("SelectedRowRange_() requires a spreadsheet");

  var selected_range = ss.getActiveRange();
  var num_rows = selected_range.getNumRows();
  if (selected_range == undefined || num_rows <= 0) {
    throw new Error("You must select at least one row."); 
    return;
  }
  
  var row_range = ss.getActiveSheet().getRange(selected_range.getRow(), 1, num_rows, ss.getLastColumn());
  if (row_range == undefined) {
    throw new Error("Can't get selected range."); 
    return;
  }
  
  return row_range;
}

function Spacer_(ui, style) {
  if (ui == undefined) throw new Error("Label_() requires a ui object");
  if (style == undefined) style = css.spacer;
  var widget = ui.createLabel(" ").setStyleAttributes(style);
  for (var i = 2; i < arguments.length; i++) widget.setStyleAttributes(arguments[i]);
  return widget;
}

function TextArea_(ui, name, style) {
  if (ui == undefined) throw new Error("TextArea_() requires a ui object");
  if (name == undefined) throw new Error("TextArea_() requires a name");
  if (style == undefined) style = css.textarea;
  var widget = ui.createTextArea().setId(name).setName(name).setVisibleLines(10).setStyleAttributes(style);
  var length = arguments.length;
  if (length == 2) widget.setStyleAttributes(css.textarea);
  else for (var i = 2; i < length; i++) widget.setStyleAttributes(arguments[i]);
  return widget;
}

function TextBox_(ui, name) {
  if (ui == undefined) throw new Error("TextBox_() requires a ui object");
  if (name == undefined) throw new Error("TextBox_() requires a name");
  var widget = ui.createTextBox().setId(name).setName(name);
  var length = arguments.length;
  if (length == 2) widget.setStyleAttributes(css.textbox);
  else for (var i = 2; i < length; i++) widget.setStyleAttributes(arguments[i]);
  return widget;
}

function Ui_(properties, title) {
  if (properties == undefined) throw new Error("Ui_() requires properties object");
  if (title == undefined) throw new Error("Ui_() requires a title");
  return UiApp.createApplication()
                .setStyleAttribute("background-color", css.default_medium_color)
                .setStyleAttribute("width", "100%")
                .setStyleAttribute("color", "#222222")
                .setTitle(title);
}

function UL_(list, style) {
  var output = "<ul>";
  var length = list.length;
  for (var i = 0; i <  length; i++) {
    output += "<li";
    if (style != undefined && style != "") output += " style=\"" + style + "\"";
    output += ">";
    output += list[i];
    output += "</li>";
  }
  output += "</ul>";
  return output;
}

var css = {};

css.default_light_color = "#E6FFE6";
css.default_medium_color = "#C2FFC2";
css.default_dark_color = "#00CC00";
css.default_small_text_size ="16px/18px";
css.default_medium_text_size = "20px/24px";
css.default_large_text_size = "36px/40px";
css.default_huge_text_size = "44px/48px";
css.default_button_text_size = "14px";

css.anchor = {
  cursor: "pointer",
  textDecoration: "none",
  color: "#15c" 
}

css.anchorbutton = {
  textDecoration: "none",
  border: "1px solid #3079ED",
  background: "#357ae8",
  borderRadius: "2px",
  color: "#fff",
  cursor: "default",
  font: "bold " + css.default_button_text_size + " Helvetica, Arial, sans-serif",
  height: "29px",
  lineHeight: "27px",
  marginLeft: "1px",
  marginRight: "1px",
  marginTop: "0px",
  marginBottom: "0px",
  opacity: "1",
  padding: "7px 20px 8px 20px",
  textAlign: "center",
  width: "72px",
  whiteSpace: "nowrap"
}

css.anchorbuttonhover = {
  background: "#357ae8",
  border: "1px solid #2f5bb7",
  opacity: ".8",
  color: "#fff"
}

css.anchorhover = {
  textDecoration: "underline",
  color: "#0000EE" 
}

css.bold = {
  fontWeight: "bold"
}

css.budgetdatagrid = {
  width: "auto", 
  background: "#000000", 
  marginTop: "0px", 
  marginLeft: "20px", 
  marginBottom: "10px", 
  paddingBottom: "0px"
}

css.budgetdatagridheader = {
  background: css.default_dark_color
}

css.budgetdatagridheaderlabel = {
  font: "bold " + css.default_medium_text_size + " arial, sans-serif",
  padding: "10px",
  paddingLeft: "10px"
}

css.budgetdatarow = {
  width: "auto",
  font: css.default_small_text_size + " arial, sans-serif",
  marginLeft: "10px",
  marginRight: "10px",
  marginTop: "5px",
  marginBottom: "5px",
  padding: "0px"
}

css.budgetdatagridlabel = {
  font: css.default_small_text_size + " arial, sans-serif",
  padding: "5px"
}

css.budgetdatagridsubtotal = {
  background: "#dddddd"
}

css.budgetdatagridtotal = {
  background: "#aaaaaa"
}

css.budgettotal = {
  font: "bold " + css.default_medium_text_size + " arial, sans-serif",
  padding: "10px"
}

css.button = {
  background: "#F2F2F2",
  border: "1px solid #dcdcdc",
  borderRadius: "2px",
  color: "#333",
  cursor: "default",
  font: "bold " + css.default_button_text_size + " Helvetica, Arial, sans-serif",
  height: "34px",
  lineHeight: "27px",
  marginLeft: "1px",
  marginRight: "1px",
  marginTop: "0px",
  marginBottom: "0px",
  minWidth: "72px",
  opacity: "1",
  padding: "0 8px",
  textAlign: "center",
  whiteSpace: "nowrap"
}

css.buttonblue = {
  border: "1px solid #3079ED",
  background: "#357ae8",
  opacity: "1",
  color: "#fff"
}

css.buttonbluedisabled = {
  background: "#4787ed",
  border: "1px solid #3079ed",
  color: "#fff",
  opacity: ".5"
}

css.buttonbluehover = {
  background: "#357ae8",
  border: "1px solid #2f5bb7",
  opacity: ".8",
  color: "#fff"
}

css.buttondisabled = {
  background: "#fff",
  border: "1px solid #dcdcdc",
  color: "#333",
  opacity: ".5"
}

css.buttongreen = {
  color: "#fff",
  border: "1px solid #29691D",
  opacity: "1",
  background: "#3A8E00"
}

css.buttongreendisabled = {
  background: "#398a00",
  border: "1px solid #29691d",
  color: "#fff",
  opacity: ".5"
}

css.buttongreenhover = {
  background: "#368200",
  border: "1px solid #2d6200",
  opacity: "1",
  color: "#fff"
}

css.buttonhover = {
  background: "#f1f1f1",
  border: "1px solid #c6c6c6",
  color: "#111",
  opacity: "1",
  textDecoration: "none"  
}

css.buttonred = {
  color: "#fff",
  textTransform: "uppercase",
  border: "1px solid #992a1b",
  opacity: "1",
  background: "#D64937"
}

css.buttonreddisabled = {
  background: "#D64937",
  border: "1px solid transparent",
  color: "#fff",
  opacity: ".5"
}

css.buttonredhover = {
  background: "#c53727",
  border: "1px solid #b0281a",
  borderBottom: "1px solid #af301f",
  opacity: "1",
  color: "#fff"
}

css.content = {
  background: css.default_medium_color,
  font: css.default_medium_text_size + " arial, sans-serif",
  margin: "0px",
  paddingTop: "10px",
  paddingBottom: "20px",
  paddingLeft: "20px",
  paddingRight: "20px",
  width: "100%"
}

css.dashboardcell = {
  width: "auto",
  font: css.default_small_text_size + " arial, sans-serif",
  margin: "5px",
  padding: "0px"
}

css.dashboardheadercell = {
  font: "bold " + css.default_medium_text_size + " arial, sans-serif",
  paddingTop: "10px",
  paddingBottom: "10px",
  paddingRight: "5px",
  paddingLeft: "5px"
}

css.divider = {
  fontWeight: "bold",
  background: "#aaaaaa"
}

css.errorbackground = {
  backgroundColor: css.default_light_color
}

css.errorbackgroundactive = {
  backgroundColor: "#ffd6db"
}

css.errorlabel = {
  font: "bold " + css.default_medium_text_size + " arial, sans-serif",
  color: "#dd4b39"
}

css.errorlabellarge = {
  font: "bold " + css.default_large_text_size + " arial, sans-serif",
//  fontWeight: "bold",
  color: "#dd4b39"
}

css.filetreebackground = {
  backgroundColor: css.default_light_color,
  font: "bold " + css.default_medium_text_size + " arial, sans-serif",
  border: "1px solid black",
  padding: "10px",
  width: "100%"
}

css.filetreelabel = {
  backgroundColor: css.default_dark_color,
  font: "bold " + css.default_small_text_size + " arial, sans-serif",
  padding: "10px",
  width: "100%"
}

css.fullwidth = {
  width: "100%"
}

css.green = {
  color: "green" 
}

css.halfwidth = {
  width:"50%"
}

css.headerlabel = {
  backgroundColor: css.default_dark_color,
  font: "bold " + css.default_large_text_size + " arial, sans-serif",
  marginBottom: "10px",
  padding: "10px"
}

css.hint = {
  font: css.default_small_text_size + " arial, sans-serif",
  color: "#666666"
}

css.hpanel = {
  paddingTop: "0px",
  paddingBottom: "0px",
  paddingLeft: "0px",
  paddingRight: "0px",
  marginTop: "0px",
  marginBottom: "0px",
  marginLeft: "0px",
  marginRight: "0px"
}

css.image = {
  margin: "10px"
}

css.imagecontainerpanel = {
  margin:"0px",
  padding:"0px"
}

css.imagepanel = {
  width: "300px",
  backgroundColor: css.default_light_color,
  paddingTop: "10px",
  paddingBottom: "10px",
  paddingLeft: "10px",
  paddingRight: "10px",
  marginTop: "0px",
  marginBottom: "10px",
  marginLeft: "0px",
  marginRight: "10px"
}

css.indent = {
  paddingLeft: "20px"
}

css.indentedparagraph = {
  width: "100%",
  backgroundColor: css.default_light_color,
  paddingTop: "15px",
  paddingBottom: "15px",
  paddingLeft: "15px",
  paddingRight: "15px",
  marginTop: "0px",
  marginBottom: "10px",
  marginLeft: "0px",
  marginRight: "0px"
}

css.indentedparagraphwhite = {
  width: "100%",
  backgroundColor: "#ffffff",
  paddingTop: "15px",
  paddingBottom: "15px",
  paddingLeft: "15px",
  paddingRight: "15px",
  marginTop: "0px",
  marginBottom: "10px",
  marginLeft: "0px",
  marginRight: "0px"
}

css.inline = { 
  display:"inline"
}

css.label = {
  color: "#222222",
  font: "20px/24px arial, sans-serif"
}

css.labellarge = {
  color: "#000000",
  paddingTop: "5px",
  paddingBottom: "5px",
  paddingLeft: "0px",
  font: "bold " + css.default_large_text_size + " arial, sans-serif"
}

css.listbox = {
  padding: "5px",
  marginTop: "5px",
  marginBottom: "5px",
  fontStyle: "sans-serif",
  fontSize: "11pt"
}

css.panel = {
  margin: "0px",
  padding: "0px",
  width: "100%"
}

css.pagetitle = {
  color: "#000000",
  paddingTop: "5px",
  paddingBottom: "5px",
  paddingLeft: "20px",
  font: "bold " + css.default_huge_text_size + " arial, sans-serif"
}

css.paragraph = {
  width: "100%",
  paddingBottom: "5px",
  paddingTop: "0px",
  paddingRight: "5px",
  marginTop: "0px",
  marginBottom: "10px"
}

css.question = {
  width: "100%",
  backgroundColor: css.default_light_color,
  paddingTop: "15px",
  paddingBottom: "15px",
  paddingLeft: "15px",
  paddingRight: "15px",
  marginTop: "5px",
  marginBottom: "5px",
  marginLeft: "0px",
  marginRight: "0px"
}

css.questionheader = {
  color: "#222222",
  font: "bold " + css.default_medium_text_size + " arial, sans-serif",
  marginBottom: "5px"
}

css.quote = {
  color: "#777777",
  paddingLeft: "20px",
  marginBottom: "5px",
  font: css.default_small_text_size + " arial, sans-serif"
}

css.roweven = {
  background: "#ffffcc"
}

css.rowhilite = { 
  background: "#ffb6c1"
}

css.rowodd = {
  background: "white"
}

css.shimbottom = {
  marginBottom: "10px" 
}

css.shimleft = {
  marginLeft: "10px"
}

css.shimright = {
  marginRight: "10px"
}

css.shimtop = {
  marginTop: "10px"
}

css.spacer = {
  height: "10px"
}

css.subtotal = {
  fontWeight: "bold",
  background: "#dddddd"
}

css.textarea = {
  marginTop: "5px",
  marginBottom: "5px",
  padding: "10px",
  marginRight: "10px",
  width: "100%",
  font: css.default_medium_text_size + " arial, sans-serif"
}

css.textbox = {
  padding: "5px",
  marginTop: "5px",
  marginBottom: "5px",
  width: "350px",
  font: css.default_medium_text_size + " arial, sans-serif"
}

css.textboxwide = {
  marginTop: "5px",
  padding: "5px",
  marginBottom: "5px",
  width: "auto",
  font: css.default_medium_text_size + " arial, sans-serif"
}

css.urlifyanchor = {
  borderColor:"blue" 
}

css.urlifyparagraph = {
  borderColor:"red" 
}

css.urlifytext = {
  borderColor:"green" 
}

function Sheet_(new_sheet) {
  
  if (new_sheet == undefined) throw new Error("Sheet_() requires a sheet");

  var debug = false;
  var use_cache = true;
  var frozen_rows = 0;
  var last_column = 0;
  var last_row = 0;
  var self = this;
  var sheet = new_sheet;
  var columns = [];
  var cache = CacheService.getScriptCache();
  var properties = PropertiesService.getScriptProperties();
  
  this.cacheOff = function() { 
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].cacheOff()");
    use_cache = false; 
    return this; 
  } 
  
  this.cacheOn = function() { 
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].cacheOn()");
    use_cache = true;
    return this; 
  } 
  
  this.clearCache = function() { 
    cache.remove(self.getDataCacheKey());  
  }
  
  this.debugOff = function() { 
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].debugOff()");
    debug = false; 
    return this; 
  } 
  
  this.debugOn = function() { 
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].debugOn()");
    debug = true;
    return this; 
  } 
  
  this.deleteRow = function(key_col, search_value) {
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].deleteRow()");
    this.reset();
    if (last_row - frozen_rows <= 0) return;
    var range = sheet.getRange(frozen_rows + 1, columns.indexOf(key_col) + 1, last_row - frozen_rows);
    if (range == undefined) return;
    var data = range.getValues();
    
    for (var row = 0; row < data.length; row++) {
      if (data[row][0] != "" && data[row][0] == search_value) {
        if (last_row - frozen_rows > 1) sheet.deleteRow(frozen_rows + row + 1);
        else sheet.getRange(frozen_rows + 1, 1, 1, last_column).clear();
        break;
      }
    }
    cache.remove(self.getDataCacheKey());
    this.reset();
  }
  
  this.getColumns = function(update_cache) { 
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].getColumns()");
    if (update_cache == undefined) update_cache = false;
//    update_cache=true;
    var cache_key = "Sheet_.getColumns" + sheet.getParent().getId() + sheet.getSheetName();
    var headers = cache.get(cache_key);
    if (update_cache || headers == null) {
      Logger.log("Sheet_[" + sheet.getSheetName() + "].getColumns(): cache miss");
      headers = sheet.getRange(1, 1, 1, last_column).getValues()[0];
      if (!(headers)) headers = [];
      cache.put(cache_key, JSON.stringify(headers), 21600);
    } else {
      headers = JSON.parse(headers); 
    }
    return headers;  
  }
  
  this.getData = function(update_cache) { 
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].getData(): START");
    if (update_cache == undefined) update_cache = false;
    this.reset();
    var data = cache.get(self.getDataCacheKey());

    if (!use_cache || update_cache || data == null) {
      Logger.log("Sheet_[" + sheet.getSheetName() + "].getData(): cache miss");
      var raw_data = [];
      try {
        raw_data = sheet.getRange(frozen_rows + 1, 1, last_row - frozen_rows, last_column).getValues();
      } catch (err) {
        raw_data = []; 
      }
  
      data = [];
      var d_length = raw_data.length;
      for (var d = 0; d < d_length; d++) {
        var row = {};
        for (var col_index in columns) {
          row[columns[col_index]] = raw_data[d][col_index]; 
        }
        data.push(row);
        if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].getData(): adding row: " + JSON.stringify(row));
      }

      cache.put(self.getDataCacheKey(), JSON.stringify(data, 21600));
      
    } else {
      data = JSON.parse(data); 
    }
    
    if (debug) {
      Logger.log("Sheet_[" + sheet.getSheetName() + "].getData(): Rows loaded: " + data.length);
      Logger.log("Sheet_[" + sheet.getSheetName() + "].getData(): END");
    }
    return data; 
  }
  
  this.getDataCacheKey = function() { 
    return "Sheet_.getData" + sheet.getParent().getId() + sheet.getSheetName();
  }
  
  this.getSheet = function() {
    return sheet;  
  }
  
  this.insertRow = function(row) {
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].insertRow()");
    this.reset();
    sheet.insertRowAfter(last_row);
    var insert_range = sheet.getRange(last_row + 1, 1, 1, last_column).clear();
    var insert_values = insert_range.getValues()[0];
    for (var column in row) { 
      insert_values[columns.indexOf(column)] = row[column];
    }
    insert_range.setValues([insert_values]);
    cache.remove(self.getDataCacheKey());
    this.reset();
  }
  
  this.insertRows = function(rows) {
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].insertRows()");
    if (rows.length < 1) return;
    this.reset();
    sheet.insertRowsAfter(last_row, rows.length);
    var insert_range = sheet.getRange(last_row + 1, 1, rows.length, last_column).clear();
    var insert_values = insert_range.getValues();
    
    for (var r = 0; r < rows.length; r++) {
      for (var column in rows[r]) { 
        insert_values[r][columns.indexOf(column)] = rows[r][column];
      }
    }    
    insert_range.setValues(insert_values);
    cache.remove(self.getDataCacheKey());
    this.reset();
  }
  
  this.reset = function() { 
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].reset()");
    SpreadsheetApp.flush();
//    try {
//      var extra_row = sheet.getRange(sheet.getLastRow() + 1, 1, 1, last_column);
//      while (extra_row != undefined) {
//        sheet.deleteRows(sheet.getLastRow() + 1, 1);
//        extra_row = sheet.getRange(sheet.getLastRow() + 1, 1, 1, last_column);
//      }
//    } catch(err) { }
    frozen_rows = sheet.getFrozenRows();
    last_row = sheet.getLastRow();
    last_column = sheet.getLastColumn();
    columns = self.getColumns();
  }

  this.saveData = function(data) {
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].saveData(): START");
    this.reset();
    var d_length = data.length;
    if (d_length == 0) return this;
    if (last_row < d_length) {
      if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].saveData(): Adding " +  (d_length - last_row) + " rows after row " + last_row + "...");
      sheet.insertRowsAfter(last_row, d_length - last_row);
    } else if (last_row > d_length) {
      if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].saveData(): Deleting " + (last_row - d_length) + " extra rows...");
      sheet.deleteRows(d_length + 1, (last_row - d_length));
    }
    var values = [];
    for (var r = 0; r < d_length; r++) {
      var new_row = [];
      for (var colname in data[r]) {
        if (columns.indexOf(colname) >= 0) new_row.push(data[r][colname]); 
      }
      values.push(new_row);
    }
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].saveData(): rows added: " + values.length);
    sheet.getRange(frozen_rows + 1, 1, d_length, last_column).setValues(values);
    this.reset();
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].saveData(): END");
    return this;
  }

  this.setCache = function(cache_state) {
    use_cache = cache_state;
    return this;
  }
  
  this.truncate = function() {
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].truncate()");
    this.reset();
    if (last_row - frozen_rows == 0) return;
    if (last_row - frozen_rows > 1) sheet.deleteRows(frozen_rows + 2, last_row - frozen_rows - 1);
    sheet.getRange(frozen_rows + 1, 1, 1, last_column).clear();
    var extra_row = sheet.getRange(sheet.getLastRow() + 1, 1, 1, last_column);
    while (extra_row != undefined) {
      try {
        sheet.deleteRows(row_num, 1);
        extra_row = sheet.getRange(sheet.getLastRow() + 1, 1, 1, last_column);
      } catch(err) { break; }
    }
    cache.remove(self.getDataCacheKey());
    this.reset();
  }
    
  this.updateCell = function(key_col, search_value, new_values) {
  
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].updateCell()");
    this.reset();
    if (last_row - frozen_rows <= 0) {
      throw new Error("No rows.");
      return;
    }
    
    var range = sheet.getRange(frozen_rows + 1, columns.indexOf(key_col) + 1, last_row - frozen_rows);
    if (range == undefined) {
      throw new Error("Search value not found in range.");
      return;
    }
    
    var data = range.getValues();
    
    for (var row = 0; row < data.length; row++) {
      if (data[row][0] != "" && data[row][0] == search_value) {
        for (var column in new_values) { 
//          update_values[columns.indexOf(column)] = new_values[column];
          sheet.getRange(frozen_rows + row + 1, columns.indexOf(column) + 1).setValue(new_values[column]);
          Logger.log("Sheet_[" + sheet.getSheetName() + "].updateCell(): " + column + " = " + new_values[column]); 
        }
      }
    }
  
    cache.remove(self.getDataCacheKey());
    this.reset();
  }

  this.updateRow = function(key_col, search_value, new_values) {
  
    if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].updateRow()");
    this.reset();
    if (last_row - frozen_rows <= 0) return;
    
    var range = sheet.getRange(frozen_rows + 1, columns.indexOf(key_col) + 1, last_row - frozen_rows);
    if (range == undefined) return;
  
    var data = range.getValues();
    var update_range;
    
    for (var row = 0; row < data.length; row++) {
      if (data[row][0] != "" && data[row][0] == search_value) {
        update_range = sheet.getRange(frozen_rows + row + 1, 1, 1, last_column);
        break;
      }
    }
  
    if (update_range == undefined) throw new Error("Can't find: " + search_value);
    
    var update_values = update_range.getValues()[0];
  
    for (var column in new_values) { 
      update_values[columns.indexOf(column)] = new_values[column];
    }
    update_range.setValues([update_values]);
    cache.remove(self.getDataCacheKey());
    this.reset();
  }

  if (debug) Logger.log("Sheet_[" + sheet.getSheetName() + "].Db created()");

  this.reset();
  return this;

}

Sheet_.prototype = { constructor: Sheet_ }

function MemDB_(rows) {
  
  var data = [];
  var debug = false;
  var excludes = [];
  var filters = [];
  var gt = [];
  var gte = [];
  var lt = [];
  var lte = [];
  var self = this;
  
  var comparator = function (a, b, name) {
    if (debug) Logger.log("MemDB_(): comparator(" + a + ", " + b + ", " + name + ")");
    var astr = String(a[name]).toLowerCase();
    var bstr = String(b[name]).toLowerCase();
    if (astr > bstr) return 1;
    if (astr < bstr) return -1;
    return 0;
  };
  
  var comparatorNumber = function (a, b, name) {    
    if (debug) Logger.log("MemDB_(): comparatorNumber(" + a + ", " + b + ", " + name + ")");
    var anum = Number(a[name]);
    var bnum = Number(b[name]);
    if (isNaN(anum)) anum = -2;
    if (isNaN(bnum)) bnum = -2;
    if (anum > bnum) return 1;
    if (anum < bnum) return -1; 
    return 0;
  };

  var testNumber = function(test_obj, test_array, test_func) {
    
    var result = true;
    
    excludeloop:
    for (var f in test_array) {
      
      var filter = test_array[f];
      result = true;
      
      columnloop:
      for (var colname in filter) {

        if (filter.hasOwnProperty(colname)) {

          var a = Number(filter[colname]);
          var b = Number(test_obj[colname])
          
          var current_result = test_func(a, b);
          
          if (debug) Logger.log("MemDB_(): testNumber(): a: " + a + " b: " + b + " result: " + current_result);        
          
          if (isNaN(b)) continue columnloop;
          
          if (isNaN(a) || !(current_result)) {
          
            result = false;
            break excludeloop;
          
          }
          
        }
        
      }
             
    }
    
    if (debug) Logger.log("MemDB_(): testNumber(): result: " + result);
    return result;
  }

  var testExcludes = function(row) {
    var result = true;
    excludeloop:
    for (var f in excludes) {
      var filter = excludes[f];
      columnloop:
      for (var colname in filter) {
        if (!row.hasOwnProperty(colname) || (filter.hasOwnProperty(colname) && filter[colname] == row[colname])) {
          result = false;
          break excludeloop;
        }
      }
    }
    if (debug) Logger.log("MemDB_(): testExcludes(): result: " + result);
    return result;
  }

  var testFilters = function(row) { 
    var result = true;
    filterloop:
    for (var f in filters) {
      var filter = filters[f];
      result = true;
      columnloop:
      for (var colname in filter) {
        if (filter.hasOwnProperty(colname) && row.hasOwnProperty(colname) && filter[colname] != row[colname]) {
          result = false;
          continue filterloop; // rejected - move to next filter
        }
      }
      if (result) break filterloop; // it matched, no need to check more filters
    }
    if (debug) Logger.log("MemDB_(): testFilters(): result: " + result);
    return result;
  }

  this.addExclude = function(f) { 
    if (debug) Logger.log("MemDB_(): addExclude(): " + JSON.stringify(f));
    excludes.push(f); 
    return this; 
  } 

  this.addFilter = function(f) { 
    if (debug) Logger.log("MemDB_(): addFilter(): " + JSON.stringify(f));
    filters.push(f); 
    return this; 
  } 

  this.addGt = function(f) { 
    if (debug) Logger.log("MemDB_(): addGt(): " + JSON.stringify(f));
    gt.push(f); 
    return this; 
  } 
  this.addGte = function(f) { 
    if (debug) Logger.log("MemDB_(): addGte(): " + JSON.stringify(f));
    gte.push(f); 
    return this; 
  } 

  this.addLt = function(f) { 
    if (debug) Logger.log("MemDB_(): addLt(): " + JSON.stringify(f));
    lt.push(f); 
    return this; 
  } 

  this.addLte = function(f) { 
    if (debug) Logger.log("MemDB_(): addLte(): " + JSON.stringify(f));
    lte.push(f); 
    return this; 
  } 

  this.addRow = function(row_obj) {
    if (debug) Logger.log("MemDB_(): addRow(): " + JSON.stringify(row_obj));
    data.push(row_obj);
  }
  
  this.addRowProperty = function(rownum, name, value) {
    if (debug) Logger.log("MemDB_(): addRowProperty(" + rownum + ", " + name + ", " + value + ")");
    data[rownum][name] = value; 
  }
  
  this.clearFilters = function() { 
    if (debug) Logger.log("MemDB_(): clearFilters()");
    filters = []; 
    excludes = []; 
    gt = []; 
    gte = []; 
    lt = []; 
    lte = []; 
    return this; 
  }

  this.debugOff = function() { 
    if (debug) Logger.log("MemDB_(): debugOff()");
    debug = false; 
    return this; 
  } 

  this.debugOn = function() { 
    if (debug) Logger.log("MemDB_(): debugOn()");
    debug = true; 
    return this; 
  } 

  this.deleteRowNum = function(rownum) {
    if (debug) Logger.log("MemDB_(): deleteRowNum()");
    if (rownum <= data.length && rownum >= 0) { 
      if (data.length == 1 && rownum == 0) data = [];
      else data.splice(rownum, 1); 
    }
  }
  
  this.getColumns = function() { 
    if (debug) Logger.log("MemDB_(): getColumns()");
    var columns = [];
    if (data.length > 0) {
      for (var prop in data[0]) {
        columns.push(prop);
      }
    }
    if (debug) Logger.log("MemDB_(): getColumns(): " + JSON.stringify(columns));
    return columns;
  }

  this.getData = function() {
    if (debug) Logger.log("MemDB_(): getData(): START");
    var rows = [];
    var d_length = data.length;
    if (debug) Logger.log("MemDB_(): getData(): data.length: " + d_length);
    for (var d = 0; d < d_length; d++) {
      var row = data[d];
      if (
        testFilters(row) && 
        testExcludes(row) &&
        testNumber(row, gt, function(a, b) { return (b>a); } ) &&
        testNumber(row, gte, function(a, b) { return (b>=a); } ) &&
        testNumber(row, lt, function(a, b) { return (b<a); } ) &&
        testNumber(row, lte, function(a, b) { return (b<=a); } ) 
      ) {
        rows.push(row);
        if (debug) {
          Logger.log("MemDB_(): getData(): Adding row " + rows.length + ": " + JSON.stringify(row));
        }
      }
    }
    if (debug) Logger.log("MemDB_(): getData(): END");
    return rows;
  }

  this.reset = function() {
    if (debug) Logger.log("MemDB_(): reset()");
    data = [];
    self.clearFilters();
  }

  this.setData = function(new_data) { 
    if (debug) Logger.log("MemDB_(): setData(): data.length: " + new_data.length);
    data = new_data;
    return this;
  }
  
  this.shuffle = function() { 
    if (debug) Logger.log("MemDB_(): shuffle()");
    for(var j, x, i = data.length; i; j = Math.floor(Math.random() * i), x = data[--i], data[i] = data[j], data[j] = x);
    return this;
  }
    
  this.sortData = function(name, desc) { 
    if (debug) Logger.log("MemDB_(): sortData()");
    data.sort(function(a, b) { return comparator(a, b, name); });
    if (desc != undefined && desc == true) data.reverse();
    return this;
  }
  
  this.sortNumberData = function(name, desc) { 
    if (debug) Logger.log("MemDB_(): sortNumberData()");
    data.sort(function(a, b) { return comparatorNumber(a, b, name); });
    if (desc != undefined && desc == true) data.reverse();
    return this;
  }

  this.truncate = function() { 
    if (debug) Logger.log("MemDB_(): truncate()");
    this.reset(); 
  }

  if (debug) Logger.log("MemDB_(): MemDB created");
  if (rows != undefined) self.setData(rows);
  return this;

} 

MemDB_.prototype = { constructor: MemDB_ }

function AdminUi_(e, properties, User) {
 
  Logger.log(JSON.stringify(User));
  
  if (!User.isIgnition) return ErrorUi_("For some reason Google doesn't think you're logged in to your Ignition account.  " + 
                                        "If you're logged in to any other Google accounts, try logging out of those and only " + 
                                        "logging in to your Ignition account.  What you should really do is start using this " + 
                                        "method to manage multiple user accounts in Chrome.  If you don't use Chrome, try opening " + 
                                        "a \"private browsing\" type window and log in there. ");
  if (!User.isAdmin) return ErrorUi_("Only the keepers of the Grant Robot are allowed to view this page.  Your indiscretion has been noted, " + User.Email + ".");
  
  var ui = Ui_(properties, properties.getProperty("round_name") + " Admin");

  var Content = Content_(ui);
  ui.add(Content);

  Content.add(Header_(ui, properties, "Hai, " + User.ShortName + "!  Welcome to the " + properties.getProperty("round_name") + " admin thingy!!"));

//  var  = Button_(ui, "submitButton", "Enter a valid email", submitButtonHandler, css.buttonred, css.buttonredhover).setEnabled(false).setStyleAttributes(css.buttonreddisabled);

  
  
  Content.add(Spacer_(ui));
  Content.add(Spacer_(ui));
  
  Content.add(Footer_(ui, properties));
  
  return ui;
}

function ScoreboardUi_(e, properties, User) {
 
  if (!User.isIgnition) return ErrorUi_("For some reason Google doesn't think you're logged in to your Ignition account.  " + 
                                        "If you're logged in to any other Google accounts, try logging out of those and only " + 
                                        "logging in to your Ignition account.  What you should really do is start using this " + 
                                        "method to manage multiple user accounts in Chrome.  If you don't use Chrome, try opening " + 
                                        "a \"private browsing\" type window and log in there. ");
  if (!User.isCat) return ErrorUi_("Only registered members of CATS may view this page.  If you're logged in to any other Google " + 
                                   "accounts, try logging out of those and only logging in to your Ignition account.");
  
  var ui = Ui_(properties, properties.getProperty("round_name") + " Scoreboard");
  var Robot = new Robot_();

  var Content = Content_(ui);
  ui.add(Content);

  Content.add(Header_(ui, properties, "Welcome to the " + properties.getProperty("round_name") + " dashboard thingy, " + User.ShortName + "!!"));

  var QueryHPanel = HPanel_(ui);
  QueryHPanel.add(Label_(ui, "Sort applications by: ", css.label, css.bold));
  var SortList = [
    ["Project Name"],
    ["Project Lead"],
    ["Category"],
    ["Rating"],
    ["Requested Amount"],
    ["Score"],
    ["Granted Amount"]
  ];
  var Sort = Listbox_(ui, "Sort", Robot.getUserSortField(), SortList);
  var OrderList = [
    ["A-Z"],
    ["Z-A"]
  ];
  var Order = Listbox_(ui, "Order", (Robot.getUserSortDirection() ? "Z-A" : "A-Z"), OrderList);
    
  var SortButtonClickHandler = ui.createServerHandler("ScoreboardSortButtonClickHandler_")
                                  .addCallbackElement(Sort)
                                  .addCallbackElement(Order);
  
  var SortButton = Button_(ui, "SortButton", "Sort", SortButtonClickHandler, css.buttonblue, css.buttonbluehover);
  SortButton.addClickHandler(ui.createClientHandler().forEventSource().setEnabled(false).setText("Sorting that shit up...").setStyleAttributes(css.buttonbluedisabled));
  SortButtonClickHandler.addCallbackElement(SortButton);
  QueryHPanel.add(Sort).add(Order).add(SortButton);
  Content.add(QueryHPanel);
  
  var applications_grid = ui.createGrid(1, 10)
                         .setId("AppGrid")
                         .setBorderWidth(1)
                         .setCellPadding(2)
                         .setCellSpacing(0)
                         .setTitle("")
                         .setStyleAttributes(css.fullwidth);
  
  Content.add(applications_grid);
  
  Scoreboard_(ui);
  
  Content.add(Spacer_(ui));
  
  return ui;
}

function ScoreboardSortButtonClickHandler_(e) {
  var ui = UiApp.getActiveApplication();
  var Robot = new Robot_();
  Robot.setUserSortField(e.parameter.Sort);
  Robot.setUserSortDirection(e.parameter.Order);
  Scoreboard_(ui);
  ui.getElementById("SortButton").setEnabled(true).setText("Sort").setStyleAttributes(css.buttonblue);
  return ui;
}

function Scoreboard_(ui) {
  
  var Robot = new Robot_();
  var DashboardDb = Robot.getDashboardDb();
  var sort = Robot.getUserSortField();
  var order = Robot.getUserSortDirection();
  var properties = PropertiesService.getScriptProperties();

  DashboardDb.sortData(sort, order);
  if (
    sort == "Requested Amount" || 
    sort == "Granted Amount" || 
    sort == "Viewed?" || 
    sort == "Questions" || 
    sort == "Responses" || 
    sort == "Should Fund" || 
    sort == "Your Score" || 
    sort == "Score") {
    DashboardDb.sortData(sort, false);
    DashboardDb.sortNumberData(sort, order);
  } else {
    DashboardDb.sortData(sort, order);
  }
    
  var Applications = DashboardDb.getData();
  var applications_grid = ui.getElementById("AppGrid");
  applications_grid.clear();
  var fields = Robot.getScoreboardColumns();
  var number_of_columns = fields.length;
  
  applications_grid.resize(1 + Applications.length, number_of_columns);
  for (var i = 0; i < number_of_columns; i++) {
    applications_grid.setWidget(0, i, Label_(ui, fields[i], css.dashboardheadercell));
  }
  applications_grid.setRowStyleAttributes(0, css.budgetdatagridheader);

  var rownum = 1;
  var hide_score = false;
  if (properties.getProperty("dashboard_hide_score") == "Yes") hide_score = true;

  for (var row = 0; row < Applications.length; row++) {

    var app_id = Applications[row]["Application ID"];
    
    var cats_score = (isNaN(Number(Applications[row]["Score"])) || Number(Applications[row]["Score"]) < 0 || Applications[row]["Application Final"] == "No") ? "Pending" : Number(Applications[row]["Score"]).toFixed(3).toString();
    var requested_amount = Label_(ui, (isNaN(Number(Applications[row]["Requested Amount"])) || Applications[row]["Requested Amount"] == "") ? "None" : Currency_(Applications[row]["Requested Amount"]));
    var granted_amount = Label_(ui, (isNaN(Number(Applications[row]["Granted Amount"])) || Applications[row]["Granted Amount"] == "") ? "None" : Currency_(Applications[row]["Granted Amount"]));
    if (hide_score) score = "";

    var url = Applications[row]["Application Url"];
    
    applications_grid
      .setWidget(rownum, fields.indexOf("Project Name"), Panel_(ui, css.dashboardcell).add(Anchor_(ui, Applications[row]["Project Name"], url, css.label, css.bold)))
      .setWidget(rownum, fields.indexOf("Project Lead"), Panel_(ui, css.dashboardcell).add(Label_(ui, Applications[row]["Project Lead"]).setWordWrap(true)))
      .setWidget(rownum, fields.indexOf("Rating"), Label_(ui, Applications[row]["Rating"]))
      .setWidget(rownum, fields.indexOf("Category"), Panel_(ui, css.dashboardcell).add(Label_(ui, Applications[row]["Category"])))
      .setWidget(rownum, fields.indexOf("Requested Amount"), requested_amount)
      .setWidget(rownum, fields.indexOf("Granted Amount"), granted_amount)
      .setWidget(rownum, fields.indexOf("Score"), Label_(ui, cats_score, css.label, css.bold))
      .setStyleAttributes(rownum, fields.indexOf("Requested Amount"), {textAlign: "right", paddingRight:"10px"})
      .setStyleAttributes(rownum, fields.indexOf("Granted Amount"), {textAlign: "right", paddingRight:"10px"})
      .setStyleAttributes(rownum, fields.indexOf("Score"), {textAlign: "center"})
      .setStyleAttributes(rownum, fields.indexOf("Rating"), {textAlign: "center"})
    ;

    if (rownum % 2 == 1) applications_grid.setRowStyleAttributes(rownum, css.rowodd);
    else applications_grid.setRowStyleAttributes(rownum, css.roweven);

    rownum++;

  }
  
  return ui;

}

//function FinalScoreUi_(e, Application, properties, user) {
//  
//  var ui = ViewUi_(e, Application, properties, user);
//  var Robot = new Robot_();
//  var ProjectName = Application.getResponseValue("ProjectName");
//  var Email = Application.getConfigurationValue("Email");
//  var Content = ui.getElementById("Content");
//  ui.setTitle(ProjectName + " - Final Score");
// 
//  var FinalScoreSection = ui.getElementById("FinalScoreSection");
//  FinalScoreSection.clear().setVisible(true);
//  
//  var OverallSection = Panel_(ui);
//  FinalScoreSection.add(Section_(ui, "CATS Overall Score").add(OverallSection));
//
//  var Section = Panel_(ui);
//  FinalScoreSection.add(Section_(ui, "CATS Individual Scores and Comments").add(Section));
//  var ScoreSheet = new Sheet_(Application.getApplication().getSheetByName("Score"));
//  var Scores = ScoreSheet.getData();
//  var ScoresDb = new MemDB_(Scores);
//  var Comments = ScoresDb.addFilter({"Question ID":"O2"}).getData()[0];
//  var CATS = new MemDB_(GetCATS_()).addExclude({Email:"grantrobot@apogaea.com"}).shuffle().getData();
//  
//  var ResultGrid = ui.createFlexTable().setStyleAttributes(css.budgetdatagrid).setBorderWidth(0).setCellSpacing(1).setCellPadding(3)
//  ResultGrid.setWidget(0, 0, Label_(ui, "Score", css.budgetdatagridheaderlabel));
//  ResultGrid.setWidget(0, 1, Label_(ui, "Comments", css.budgetdatagridheaderlabel));
//  ResultGrid.setRowStyleAttributes(0, css.budgetdatagridheader);
//  ResultGrid.setColumnStyleAttributes(1, css.fullwidth);
//  
//  var NoAbstain = [];
//  var overall_score = -1;
//  for (var i = 0; i < CATS.length; i++) {
//    
//    var cat = CATS[i].Email;
//    var cat_score = ScoresDb.clearFilters().addFilter({"Question ID":"SCORE1"}).getData()[0][cat];
//    if (cat_score == undefined || cat_score == "" || cat_score == 0) cat_score = "Abstain"; 
//    if (cat_score != "Unscored" && cat_score != "Abstain") NoAbstain.push(cat);
//    ResultGrid.setWidget(i + 1, 0, Label_(ui, cat_score, css.budgetdatarow, css.label, css.bold).setHorizontalAlignment(UiApp.HorizontalAlignment.CENTER));
//    ResultGrid.setWidget(i + 1, 1, Label_(ui, Comments[cat], css.budgetdatarow, css.label));
//    ResultGrid.setRowStyleAttribute(i + 1, "background-color", "#FFFFFF")
//
//  }
//
//  var QuestionIds = ["D1","D2","D3","D4","D5","D6","D7","D8","L1","L2","L3","L4","L5","L6","L7","L8","L9","S1","S2","S3","S4","S5","S6","T1","T2","T3","T4","T5","B1","B2","B3","B4","B5","O1"];
//  
//  var DetailGrid = ui.createFlexTable().setStyleAttributes(css.budgetdatagrid).setBorderWidth(0).setCellSpacing(1).setCellPadding(3);
//
//  DetailGrid.setWidget(0, 0, Label_(ui, "Score", css.budgetdatagridheaderlabel));
////  DetailGrid.setWidget(0, 1, Label_(ui, "Category", css.budgetdatagridheaderlabel));
//  DetailGrid.setWidget(0, 1, Label_(ui, "Question", css.budgetdatagridheaderlabel));
//  DetailGrid.setRowStyleAttributes(0, css.budgetdatagridheader);
//  DetailGrid.setColumnStyleAttributes(1, css.fullwidth);
//
//  var total_score = 0;
//  
//  for (var q = 0; q < QuestionIds.length; q++) {
//    
//    var q_score = 0;
//    var question = ScoresDb.clearFilters().addFilter({"Question ID":QuestionIds[q]}).getData()[0];
//    
//    for (var c = 0; c < NoAbstain.length; c++) {
//      q_score += question[NoAbstain[c]];
//    }
//    
//    q_score = q_score / NoAbstain.length;
//    total_score += q_score;
//
//    var result = 0;
//    if (QuestionIds[q] == "O1") result = (q_score * 100) / 5;
//    else result = q_score * 100;
//    if (result == undefined) result = 0;
//    result = result.toFixed(0).toString();
//        
//    DetailGrid.setWidget(q + 1, 0, Label_(ui, result + "%", css.budgetdatarow, css.label, css.bold).setHorizontalAlignment(UiApp.HorizontalAlignment.CENTER));
////    DetailGrid.setWidget(q + 1, 1, Label_(ui, question["Section"], css.budgetdatarow));
//    DetailGrid.setWidget(q + 1, 1, Label_(ui, question["Description"], css.budgetdatarow, css.label));
//    DetailGrid.setRowStyleAttribute(q + 1, "background-color", "#FFFFFF");
//
//  }
//
//  OverallSection.add(Paragraph_(ui, Panel_(ui).add(Label_(ui, "Overall score: " + total_score.toFixed(3).toString(), css.labellarge, css.bold))
//              .add(Spacer_(ui))
//              .add(Label_(ui, "The maximum score for an application is 38, the sum of 33, 1 point questions,  and 1, 5 point question.  The overall score for application is the average of the individual CATS scores.  Abstains are not counted in the average.")))
//  );
//  
//  Section.add(ResultGrid);
//  
//  var DetailSection = Panel_(ui);
//  FinalScoreSection.add(Section_(ui, "CATS Score Detail").add(DetailSection));
//  DetailSection.add(Paragraph_(ui, Label_(ui, "The percentages are a reflection of the number of CATS who felt your application answered/addressed the question.  A perfect score is 100%.  This means all CATS were in agreement that the application answered/addressed the question..  Higher numbers indicate that most CATS felt the application answered/addressed this question.  Lower numbers indicate that most CATS did not feel the application adequately answered/addressed this question.")));
//  DetailSection.add(Spacer_(ui));
//  DetailSection.add(DetailGrid);
//  
//  return ui;
//  
//}

