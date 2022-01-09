const Discord = require('discord.js');
const config = require("./config.json");
const disbut = require('discord-buttons')
const client = new Discord.Client();
const { MessageEmbed } = require('discord.js');

disbut(client);

var guild;
var applyCategory;
var applyChannel;
var offRole;

client.once('ready', () => {

    console.log("Connected !");

    guild = client.guilds.cache.find(g => g.id === config.GUILD_ID);

    applyCategory = client.channels.cache.find(c => c.name == config.CATEGORY_NAME.APPLY && c.type == "category");
    applyChannel = client.channels.cache.find(c => c.name == config.CHANNEL_NAME.APPLY && c.type == "text");

    offRole = guild.roles.cache.find(r => r.name == config.ROLES_NAMES.OFFICER);
    memberRole = guild.roles.cache.find(r => r.name == config.ROLES_NAMES.MEMBER);
    applyRole = guild.roles.cache.find(r => r.name == config.ROLES_NAMES.APPLY);


    applyChannel.messages.fetch({ limit: 100 }).then(messages => {


        // attention si il y a plus de 100 messages (max)

        //Iterate through the messages here with the variable "messages".
        messages.forEach(msg => msg.delete() //removing msg in applyChan
        )
    })
        .then(() => {
            console.log("Msg removed !");

            let applyButton = new disbut.MessageButton()
                .setStyle('green') // button color
                .setLabel('Start') // button text
                .setID('START_APPLY') // button id. 
            //.setDisabled() // OPTIONAL



            applyChannel.send('Click the button in order to strat yout apply', {
                buttons: [applyButton]
            })

        });

});



//on detecte l'evenement guildMemberAdd (un nouveau membre rejoint)
client.on('guildMemberAdd', member => {
    //send a dm on first connection
    member.send(`Je m'appelle Louise. Bienvenue sur le Discord Wraith, <@${member.id}> ! Si tu souhaites postuler, ça se passe ici => <#${applyChannel.id}>.`);

});



//question model (embed)


function createEmbed(index, questionArray) {
    index = index - 1;
    return new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Question ' + questionArray[index].KEY)
        //.setURL('https://discord.js.org/')
        .setDescription('' + questionArray[index].TITLE)
        .setThumbnail('https://i.imgur.com/AfFp7pu.png')
        .addFields(
            { name: 'Regular field title', value: 'Some value here' },
            { name: '\u200B', value: '\u200B' },
            { name: 'Inline field title', value: 'Some value here', inline: true },
            { name: 'Inline field title', value: 'Some value here', inline: true },
        )
        .addField('Inline field title', 'Some value here', true)
        .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter('Some footer text here', 'https://i.imgur.com/AfFp7pu.png');
}





client.on('clickButton', async (button) => {


    // code here

    //l'utilisateur clique sur le bouton Start du chan commun Apply
    if (button.id == "START_APPLY") {
        await button.clicker.fetch();
        await button.reply.defer();
        const user = button.clicker.user; //get the user who clicked the button

        let member = guild.members.cache.find(m => m.id === user.id); //get the member associated to this user (in order to get his roles grom this guild)

        let role = member.roles.cache.find(r => r.name == config.ROLES_NAMES.APPLY); //check if this member is an apply
        if (role == undefined) {

            //this member is not an apply
            guild.channels.create("apply-" + user.username, {
                type: 'GUILD_TEXT',

            }).then(channel => {
                channel.setParent(applyCategory.id).then(() => {
                    channel.updateOverwrite(guild.id, { VIEW_CHANNEL: false }).then(() => { //on bloque les permissions de tout les utilisateurs du discord
                        channel.createOverwrite(offRole, { VIEW_CHANNEL: true }).then(() => {//on ajoute une exception aux officiers
                            channel.createOverwrite(user.id, { VIEW_CHANNEL: true }).then(() => {//l'utilisateur ayant cliqué sur le bouton a les permissions de voir le chan
                                member.roles.add(applyRole).then(() => {
                                    applyChannel.send(`<@${user.id}> Votre demande d'apply chez Wraith à bien été prise en compte, referrez-vous au channel <#${channel.id}> pour continuer !`)
                                        .then(msg => msg.delete({ timeout: "30000" })); //Envoie un message qui notifie l'utilisateur et qui le supprime automatiquement après 30sec
                                    channel.send(`<@${user.id}> vous pouvez poursuivre votre apply dans ce channel qui vous est reservé !`);

                                    //create the button for the first question
                                    let question1Button = new disbut.MessageButton()
                                        .setStyle('green') // button color
                                        .setLabel('Next') // button text
                                        .setID('QUESTION_1_' + user.id) // button id. 
                                    //.setDisabled() // OPTIONAL



                                    channel.send(createEmbed(1, config.QUESTIONS), {
                                        buttons: [question1Button]
                                    })
                                });




                            });

                        })

                    });

                });

            });
        }
        else {
            //this member is already an apply

            let userApplyChannel = client.channels.cache.find(c => {
                return c.name == `apply-${user.username}`.toLowerCase() && c.type == "text"
            });
            if (userApplyChannel != undefined) {
                //le user a bien la grade apply et son chan existe bien
                applyChannel.send(`<@${user.id}>, vous avez déjà un channel qui vous est associé, vous pouvez poursuivre votre apply ici : <#${userApplyChannel.id}>`)
                    .then(msg => msg.delete({ timeout: "30000" })); //Envoie un message qui notifie l'utilisateur et qui le supprime automatiquement après 30sec
            }
            else {
                //le user a le grade apply mais son chan n'existe plus, alors on le recréer
                guild.channels.create("apply-" + user.username, {
                    type: 'GUILD_TEXT',

                }).then(channel => {
                    channel.setParent(applyCategory.id).then(() => {
                        channel.updateOverwrite(guild.id, { VIEW_CHANNEL: false }).then(() => { //on bloque les permissions de tout les utilisateurs du discord
                            channel.createOverwrite(offRole, { VIEW_CHANNEL: true }).then(() => {//on ajoute une exception aux officiers
                                channel.createOverwrite(user.id, { VIEW_CHANNEL: true }).then(() => {//l'utilisateur ayant cliqué sur le bouton a les permissions de voir le chan
                                    applyChannel.send(`<@${user.id}> Votre demande d'apply chez Wraith à bien été prise en compte, referrez-vous au channel <#${channel.id}> pour continuer !`)
                                        .then(msg => msg.delete({ timeout: "30000" })); //Envoie un message qui notifie l'utilisateur et qui le supprime automatiquement après 30sec
                                    channel.send(`<@${user.id}> vous pouvez poursuivre votre apply dans ce channel qui vous est reservé !`);

                                    //create the button for the first question
                                    let question1Button = new disbut.MessageButton()
                                        .setStyle('green') // button color
                                        .setLabel('Next') // button text
                                        .setID('QUESTION_1_' + user.id) // button id. 
                                    //.setDisabled() // OPTIONAL



                                    channel.send(createEmbed(1, config.QUESTIONS), {
                                        buttons: [question1Button]
                                    })
                                });




                            })

                        });

                    });

                });
            }

        }
    }

    //l'utilisateur clique sur le bouton next apres avoir repondu a la question 1
    else if (button.id.startsWith("QUESTION")) {
        //on récupère le chan de l'utlisateur
        await button.clicker.fetch();
        await button.reply.defer();
        const user = button.clicker.user; //get the user who clicked the button

        //on vérifie que l'utilisateur a repondu a la quesiton
        let key = parseInt(button.id.split('_')[1]); //on récupere le numéro du bouton cliqué

        button.channel.messages.fetch({ limit: 1 }).then(messages => {
            let lastMessage = messages.first();
            // on verifie que le dernier message soit bien un message de l'apply
            if (lastMessage.author.username == user.username) {
                //le dernier msg du chan provient de l'apply

                //alors on peut envoyer la question suivante


                //on verifie que nous ne sommes pas a la derniere qustion
                if (key != config.QUESTIONS.length) {
                    // nous ne sommes pas a la derniere question

                    //on supprime le bouton next de la question precedente
                    button.message.edit(createEmbed(key, config.QUESTIONS), { component: null });

                    //create the button for the next question
                    let nextButton = new disbut.MessageButton()
                        .setStyle('green') // button color
                        .setLabel('Next') // button text
                        .setID('QUESTION_' + (key + 1) + '_' + user.id) // button id. 
                    //.setDisabled() // OPTIONAL



                    button.channel.send(createEmbed(key + 1, config.QUESTIONS), {
                        buttons: [nextButton]
                    })

                }
                else {
                    //nous sommes a la derniere question





                    button.message.edit(createEmbed(key, config.QUESTIONS), { component: null }).then(() => {
                        button.channel.send(`<@${user.id}> Votre apply a bien été prise en compte par Wraith ! Nous interragirons avec toi au travers de ce channel. A bientôt !`)

                        //on clone le chan de l'apply pour les membres et les offs

                        guild.channels.create("apply-" + user.username + "-avis", {
                            type: 'GUILD_TEXT',

                        }).then(channel => {
                            channel.setParent(applyCategory.id).then(() => {
                                channel.updateOverwrite(guild.id, { VIEW_CHANNEL: false }).then(() => { //on bloque les permissions de tout les utilisateurs du discord
                                    channel.createOverwrite(offRole, { VIEW_CHANNEL: true }).then(() => {//on ajoute une exception aux officiers
                                        channel.createOverwrite(memberRole, { VIEW_CHANNEL: true }).then(() => {//on ajoute une exception aux membres


                                            button.channel.messages.fetch({ limit: 100 }).then(messages => {
                                                console.log(`Received ${messages.size} messages`);


                                                //Iterate through the messages here with the variable "messages".
                                                [...messages].reverse().forEach(message => {

                                                    //on copie les messages 1 par 1 dans le nvx chan
                                                    let content = "";
                                                    let embed;

                                                    //on regarde le contenue du message en text
                                                    if (message[1].content.length > 0) {
                                                        content = message[1].content;
                                                    }

                                                    //sinon on regarde si le message est un embed
                                                    else if (message[1].embeds.length > 0) {
                                                        embed = message[1].embeds[0];
                                                    }

                                                    if (content != "") {
                                                        //le message possède un content text

                                                        //creation du fonction de copy de message qui force le synchronisme pour avoir les messages dans copiés dans le bon ordre
                                                        async function copySimpleMsg(msg, channel) {
                                                            await channel.send(msg);

                                                        }
                                                        copySimpleMsg(content, channel);
                                                    }
                                                    else if (embed != undefined) {
                                                        //le message ne possède pas de content et est donc un embed

                                                        //creation du fonction de copy de message qui force le synchronisme pour avoir les messages dans copiés dans le bon ordre
                                                        async function copySimpleEmbed(embed, channel) {

                                                            await channel.send(embed);



                                                        }
                                                        copySimpleEmbed(embed, channel);
                                                    }



                                                });

                                                // attention si il y a plus de 100 messages (max)
                                                if (messages.size >= 10) {
                                                    // il y a potentiellement plus de 100 messages (sauf si pile 100 qui est le max)
                                                    channel.send(`Attention, cette candidature comporte potentiellement plus de 100 messages, et je ne suis pas capable d'en recuperer autant. <@&${offRole.id}> Referrez-vous au channel spécifique de l'apply : <#${button.channel.id}> `);
                                                }





                                            })
                                        });

                                    })
                                });
                            });




                        })

                    });




                }





            } else {
                //le dernier msg du chan ne proviet pas de l'apply

                //alors on envoie un msg temporaire lui demandant de bien repondre a la question 
                button.channel.send(`<@${user.id}> Il semblerait que vous n'ayez pas repondu correctement à la question ${key} !`)
                    .then(msg => msg.delete({ timeout: "5000" })); //Envoie un message qui notifie l'utilisateur et qui le supprime automatiquement après 5sec
            }

        })
            .catch(console.error);





    }
});

client.login(config.BOT_TOKEN);