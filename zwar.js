module.exports.config = {
    name: "zwar",
    version: "1.0.4",
    credits: "GinzaTech & Michael",
    description: "Tham gia chiến trường zombie trên chính box chat của bạn",
    usages: "zwar [register/shop/upgrade/info/prison/status/sell]",
    commandCategory: "game",
    cooldowns: 0,
    dependencies: {
         "fs-extra": "",
         "axios": ""
     }
};

module.exports.onLoad = async () => {
    const fs = require ("fs-extra");
    const axios = require ("axios");

    const dirMaterial = __dirname + `/cache/zwar/`;

    if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
    if (!fs.existsSync(dirMaterial + "data.json")) (await axios({
            url: "https://raw.githubusercontent.com/GinzaTech/zwar/main/data.json",
            method: 'GET',
            responseType: 'stream'
        })).data.pipe(fs.createWriteStream(dirMaterial + "data.json"));

    if (!fs.existsSync(dirMaterial + "gun.json")) (await axios({
            url: "https://raw.githubusercontent.com/GinzaTech/zwar/main/gun.json",
            method: 'GET',
            responseType: 'stream'
        })).data.pipe(fs.createWriteStream(dirMaterial + "gun.json"));

    return;
}

module.exports.handleReaction = async ({ api, event, handleReaction, Currencies }) => {
    if (handleReaction.author != event.userID) return;
    try {
        switch (handleReaction.type) {
            case "upgradeSlotConfirm": {
                var userData = await Currencies.getData(event.userID),
                    money = userData.money,
                    zwar = userData.data.zwar;

                for (var i = 0; i < handleReaction.choose; i++) {
                    zwar.critters.push({
                        name: "Empty",
                        size: 0.0,
                        price: 0,
                    })
                }

                money = money - (handleReaction.choose * 2000);

                var data = userData;
                data.zwar = zwar;
                await Currencies.setData(event.userID, { money, data });
                return api.sendMessage(`[Shop Hệ Thống Vũ Khí] Bạn đã mua thành công ${handleReaction.choose} vị trí!`, event.threadID, event.messageID);
            }
            default:
                break;
        }
    }
    catch (e) {
        console.log(e);
        return api.sendMessage("[Zombie War] zombie đã tiêu diệt hết người chơi", event.threadID, event.messageID);
    }
}

module.exports.handleReply = async function({ api, event, client, handleReply, Currencies }) {
    if (handleReply.author != event.senderID) return;
    const { readFileSync } = require("fs-extra");
    const emptygun = {
        name: "Empty",
        size: 0.0,
        price: 0,
    };

    var datagun = require('./cache/zwar/gun.json');

    switch (handleReply.type) {
        case "shop": {
            switch (event.body) {
                case "1": {
                    var entryList = [],
                        i = 1;
                    for (const gun of datagun.gun) {
                        entryList.push(`${i}. ${gun.name}: ${gun.price} Đô [ ❖ ] Độ bền: ${gun.duribility}, Thời Gian Chờ : ${gun.time} giây`);
                        i++;
                    }
                    return api.sendMessage(
                        "[ ❖-❖-❖ ] [ = [ Shop Weapon] = ] [ ❖-❖-❖ ]" +
                        "\n[ ❖-❖ ] Hãy Lựa Chọn Theo Cách Của Bạn [ ❖-❖ ]\n\n" +
                        entryList.join("\n") +
                        "\n[ ❖ ] => Hãy Trả Lời Tin Nhắn Bot Và Chọn Theo Số Thứ Tự <= [ ❖ ]"
                    , event.threadID, (error, info) => {
                        global.client.handleReply.push({
                            name: this.config.name,
                            messageID: info.messageID,
                            author: event.senderID,
                            type: "buyShop"
                        });
                    }, event.messageID);
                }
                case "2": {
                    var userData = (await Currencies.getData(event.senderID)),
                        moneyAll = 0,
                        index = 0,
                        zwar = userData.data.zwar;

                    for (gun of zwar.critters) {
                        moneyAll += gun.price;
                        zwar.critters[index] = emptygun;
                        index++;
                    }
                    const money = userData["money"] += moneyAll;
                    await Currencies.setData(event.senderID,{ money, zwar });
                    return api.sendMessage(`[ Zombie War ] Tổng số tiền bạn bán được là: ${moneyAll} coins`, event.threadID, event.messageID);
                }
                case "3": {
                    const userData = (await Currencies.getData(event.senderID)).data.zwar;
                    return api.sendMessage(`[ = ] Shop Weapon (Upgrade) [ = ]\n\n[!] Hiện tại bạn đang có ${userData.critters.length += 1} vị trí có thể chứa đồ trong kho đồ của bạn\n[ ❖ ] => Để Nâng Cấp Hãy Reply Tin Nhắn Và Ghi Số Slot <= [❖]`, event.threadID, (error, info) => {
                        global.client.handleReply.push({
                            name: this.config.name,
                            messageID: info.messageID,
                            author: event.senderID,
                            type: "upgradeSlot"
                        })
                    })
                }
                default:
                    break;
            }
            return;
        }
        //Shop
        case "buyShop": {
            try {
                const choose = parseInt(event.body);
                var userData = (await Currencies.getData(event.senderID));
                if (isNaN(event.body)) return api.sendMessage("[Zombie War] Lựa chọn của bạn không phải là một con số!", event.threadID, event.messageID);
                if (choose > datagun.length || choose < datagun.length) return api.sendMessage("[Zombie War] Lựa chọn của bạn vượt quá danh sách", event.threadID, event.messageID);
                const gunUserChoose = datagun.gun[choose - 1];
                if (userData.money < gunUserChoose.price) return api.sendMessage("[Zombie War] Bạn không đủ tiền để có thể súng mới", event.threadID, event.messageID);
                userData.data.zwar.weapon.name = gunUserChoose.name;
                userData.data.zwar.weapon.price = gunUserChoose.price;
                userData.data.zwar.weapon.time = gunUserChoose.time;
                console.log(userData['data']['zwar']['weapon']);
                userData.money = userData.money - gunUserChoose.price;
                var data = userData;
                data.zwar = userData.data.zwar;
                await Currencies.setData(event.senderID, { money: userData.money, data });
                console.log((await Currencies.getData(event.senderID)).data.zwar);
                return api.sendMessage(`[Shop weapon] Bạn đã mua thành công: ${gunUserChoose.name} với giá ${gunUserChoose.price} coins!`, event.threadID, event.messageID);
            }
            catch (e) {
                console.log(e);
                return api.sendMessage("[Zombie War] Hiện tại không thể mở shop vì đã xảy ra lỗi hệ thống, vui lòng thử lại sau hoặc đợi thông báo!", event.threadID, event.messageID); 
            }
        }
        //upgrade
        case "upgradeSlot": {
            try {
                const choose = parseInt(event.body);
                var userData = (await Currencies.getData(event.senderID));
                if (isNaN(event.body)) return api.sendMessage("[Zombie War] Lựa chọn của bạn không phải là một con số!", event.threadID, event.messageID);
                if (choose <= 0) return api.sendMessage("[Zombie War] Lựa chọn của bạn không phải là số âm!", event.threadID, event.messageID);
                const moneyOfUpgrade = choose * 2000;
                if (userData.money < moneyOfUpgrade) return api.sendMessage(`[Shop Weapon] Bạn không đủ tiền để có thể mua thêm chỗ cho túi đồ, bạn còn thiếu khoảng ${moneyOfUpgrade - userData.money}`, event.threadID, event.messageID);
                return api.sendMessage(`[Shop Weapon] Bạn đang cần mua ${choose} vị trí với giá ${moneyOfUpgrade} coins, nếu bạn đồng ý có thể reaction tin này!`, event.threadID, (error, info) => {
                    global.client.handleReaction.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        choose,
                        type: "upgradeSlotConfirm"
                    })
                })
            }
            catch (e) {
                console.log(e);
                return api.sendMessage("[Zombie War] Hiện tại không thể tham gia vì đã xảy ra lỗi hệ thống, vui lòng thử lại sau hoặc đợi thông báo!, Code : 001", event.threadID, event.messageID);
            }
        }
        default: {
            break;
        }
    }
}

module.exports.makeEmptyCritterList = () => {
    var zombieList = [];
    for (i = 0; i < 9; i++) {
        zombieList.push({
            name: "Empty",
            size: 0.0,
            price: 0,
        });
    }
    return zombieList;
}

module.exports.getRarity = () => { 
    this.getRarityRecursion(Math.floor(Math.random() * Math.floor(100)), -1, 0)
}

module.exports.getRarityRecursion = (chance, index, number) => {
    const catchChance = {
        'Siêu Bình Thường':50,
        'Bình Thường': 50,
        'Trung Bình': 45,
        'Hiếm': 50,
        'Siêu Hiếm': 50,
        'Cực Hiếm' : 50,
        'Cực Phẩm' : 50
    }
    const rarityList = [
        'Siêu Bình Thường',
        'Bình Thường',
        'Trung Bình',
        'Hiếm',
        'Siêu Hiếm',
        'Cực Hiếm',
        'Cực Phẩm'
    ]

    if (index === 0 && chance <= catchChance[rarityList[0]]) return rarityList[0]
    else if (index >= rarityList.length - 1 && chance >= catchChance[rarityList[rarityList.length - 1]]) return rarityList[rarityList.length - 1]
    else if (chance > number && chance <= (number + catchChance[rarityList[index + 1]])) return rarityList[index + 1];
    else return this.getRarityRecursion(chance, index + 1, (number + catchChance[rarityList[index + 1]]));
}

module.exports.getZombie = (zombieRarity, currentHour, currentMonth) => {
    const { readFileSync } = require ("fs-extra");
    var dataZombie = require('./cache/zwar/data.json');
    var newZombieData = dataZombie.Zombie.filter(Zombie => Zombie.time.includes(currentHour) && Zombie.months.includes(currentMonth) && Zombie.rarity.includes(zombieRarity));
    return newZombieData;
}

module.exports.addCritter = (user, critter, api, event) => {
    if (user.critters[user.critters.length - 1].price != 0 || typeof user.critters[user.critters.length - 1].price == "undefined") api.sendMessage("[zwar] Túi của bạn không còn đủ không gian lưu trữ!", event.threadID, event.messageID);
    else {
        for (i = 0; i < user.critters.length; i++) {
            if (user.critters[i].price === 0) {
                user.critters[i] = critter;
                i = user.critters.length;
            }
        }
    }
    return user.critters;
}

module.exports.run = async function({ api, event, args, client, Currencies, Users }) {
    const emptygun = {
        name: "None",
        price: 0,
        time: 120
    };
    var dataUser = (await Currencies.getData(event.senderID)).data.zwar || {};
    switch (args[0]) {
        case "register": {
            try {
                if (Object.entries(dataUser).length != 0) return api.sendMessage("[Zombie War] Bạn đã từng đăng ký vào chiến trường!", event.threadID, event.messageID);
                var s = {};
                s['zwar'] = {};
                s['zwar'].weapon = emptygun;
                s['zwar'].critters = this.makeEmptyCritterList();
                var data = (await Currencies.getData(event.senderID));
                data = s;
                await Currencies.setData(event.senderID, { data });
                return api.sendMessage("[Zombie War] Bạn đã đăng ký vào chiến trường thành công", event.threadID, event.messageID);
            }
            catch (e) {
                console.log(e);
                return api.sendMessage("[Zombie War] Hiện tại không thể đăng ký vì đã xảy ra lỗi hệ thống, vui lòng thử lại sau hoặc đợi thông báo!", event.threadID, event.messageID);
            }
        }
        case "shop": {
            if (Object.entries(dataUser).length == 0)return api.sendMessage("[Zombie War] Bạn cần đăng ký vào chiến trường, hãy sử dụng '[ /Zwar register ]'", event.threadID, event.messageID);
            return api.sendMessage(
                "[ ❖ ] [ = [ Shop Weapon ] = ] [ ❖ ]" +
                "\n[ ❖ ] Hãy Nhập Lựa Chọn [ ❖ ]" +
                "\n[ ❖ ] Mua Súng [ 1 ] [ ❖ ]" +
                "\n[ ❖ ] Bán Zombie [ 2 ] [ ❖ ]" +
                "\n[ ❖ ] Nâng Cấp Kho [ 3 ] [ ❖ ]" +
                "\n\n[ ❖ ] => Hãy Trả Lời Tin Nhắn Để Chọn !"
            , event.threadID, (error, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "shop"
                });
            }, event.messageID);
        }
        case "prison": {
            if (Object.entries(dataUser).length == 0)return api.sendMessage("[Zombie War] Bạn cần đăng ký vào chiến trường, hãy sử dụng '[ /zwar register ]'", event.threadID, event.messageID);
            var listCritters = [],
                msg = "",
                index = 1;
            for (const gun of dataUser.critters) {
                listCritters.push({
                    name: gun.name,
                    rarity: gun.rarity,
                    price: gun.price,
                    size: gun.size
                })
            }

            listCritters.sort((a, b) => {
                if (a.size > b.size) return -1;
                if (a.size < b.size) return 1;

                if (a.price > b.price) return -1;
                if (a.price < b.price) return 1;
            })

            for (const sorted of listCritters) {
                if (index == 11 || sorted.name == "Empty") ""
                else {
                    msg += `\n${index}/ ${sorted.name} : ${sorted.size}cm - ${sorted.price} coins`;
                    index += 1;
                }
            }
            if (msg.length == 0) msg = "[!] Hiện tại prison của bạn chưa có gì [!]";
            const filter = listCritters.filter(gun => gun.name !== "Empty");

            return api.sendMessage(`[※] [ Kho Đồ ] [※]\n${msg}\n\n[※] [ Thông Tin Súng ] [※]\n\n৹ [ Tên Súng ] : ${dataUser.weapon.name || 'Chưa có'}\n৹ [ Số đạn Còn Lại ] : ${dataUser.weapon.duribility} lần bắn\n৹ [ Tình trạng ] : ${(dataUser.weapon.duribility == 0) ? "Đã hết đạn" : "Hoạt động tốt!"}\n\n[※] [ prison Info ] [※]\n\n৹ Slots: ${dataUser.critters.length += 1}\n৹ Tình trạng: ${((dataUser.critters.length - filter.length) == 0) ? "Túi đã đầy" : "Túi vẫn còn chỗ trống"}`, event.threadID, event.messageID);
        }
        default: {
            try {
                const format = new Intl.NumberFormat();
                if (Object.entries(dataUser).length == 0)return api.sendMessage("[Zombie War] Bạn cần đăng ký vào chiến trường, hãy sử dụng '/zwar register'", event.threadID, event.messageID);
                var dates = Math.floor((Math.abs(dataUser.time - new Date()) / 1000) / 60);
                if (dataUser.weapon.price === 0) return api.sendMessage("[Zombie War] Bạn cần mua súng, hãy sử dụng 'zwar shop' để mua mới!", event.threadID, event.messageID);
                else if (dates < dataUser.weapon.time) return api.sendMessage("[Zombie War] Bạn đang trong thời gian cooldown, hãy thử lại sau!", event.threadID, event.messageID);
                else if (dataUser.weapon.duribility < 1) {
                    dataUser.weapon = emptygun;
                    return api.sendMessage("[Zombie War] Súng của bạn đã hỏng, sử dụng '/zwar' để mua súng mới!", event.threadID, event.messageID);
                }

                var zombieRarity = this.getRarity();
                var currentHour = new Date().getHours();
                var currentMonth = new Date().getMonth();
                const zombieData = await this.getZombie(zombieRarity, currentHour, currentMonth);
                if (!zombieData || zombieData.length == 0) return api.sendMessage("[Zombie War] Hiện tại không có zombie để bắn", event.threadID, event.messageID);

                var today = new Date().toLocaleString("vi-vn", { timeZone: "Asia/Ho_Chi_Minh" });
                var caught = zombieData[Math.floor(Math.random() * ((zombieData.length - 1) - 0 + 1)) + 0];
                caught.size = ((Math.random() * (caught.size[0] - caught.size[1]) + caught.size[1]).toFixed(1));
                dataUser.critters = this.addCritter(dataUser, caught, api, event);
                dataUser.weapon.duribility--;
                await Currencies.setData(event.senderID, {zwar: dataUser});
                const nameUser = (await Users.getData(event.senderID)).name || (await Users.getInfo(envent.senderID)).name;
               
                return api.sendMessage(
                    "[ ❖-❖-❖ ] Bạn Đã Giết : [" + caught.name + "] [ ❖-❖-❖ ]" +
                    "\n  [ ❖-❖ ] [ = ] [ = [ Thông Tin Chung ] = ] [ = ] [ ❖-❖ ]"+
                    "\n[ ❖ ] [ Người bắt ] : {name} [ ❖ ] " 
                    .replace(/\{name}/g, nameUser)
                +   "\n[ ❖ ] [ Kích Cỡ Zombie] : " + caught.size + " m" +
                    "\n[ ❖ ] [ Độ Hiếm Zombie] : " + caught.rarity +
                    "\n[ ❖ ] [ Mô Tả Zombie ] : " + caught.catch +
                    "\n[ ❖ ] [ Xuất Hiện Vào Tháng ] : " + caught.months + 
                    "\n[ ❖ ] [ Tổng Số Tiền Có Thể Kiếm Khi săn Được] : " + format.format(caught.price) + " Đô" +
                    "\n[ ❖ ] " + today + "[ ❖ ]"
                , event.threadID, event.messageID);
            }
            catch (e) {
                console.log(e);
                return api.sendMessage("[Zombie War] Hiện tại không thể tham gia vì đã xảy ra lỗi hệ thống, vui lòng thử lại sau hoặc đợi thông báo!", event.threadID, event.messageID);
            }
        }
    }
}
