import agent from './agent.js';
import alien from './alien.js';
import archaeologist from './archaeologist.js';
import artist from './artist.js';
import bat from './bat.js';
import beerguy from './beerguy.js';
import blackcat from './blackcat.js';
import blader from './blader.js';
import bobby from './bobby.js';
import bouncer from './bouncer.js';
import brassman from './brassman.js';
import brother from './brother.js';
import bull from './bull.js';
import cabbie from './cabbie.js';
import camel from './camel.js';
import candlekid from './candlekid.js';
import capoeira from './capoeira.js';
import clubber from './clubber.js';
import cop from './cop.js';
import corgi from './corgi.js';
import coroner from './coroner.js';
import corpsepaint from './corpsepaint.js';
import cosplayer from './cosplayer.js';
import count from './count.js';
import cowboy from './cowboy.js';
import critic from './critic.js';
import croc from './croc.js';
import crow from './crow.js';
import crowdsurfer from './crowdsurfer.js';
import cultist from './cultist.js';
import cyclist from './cyclist.js';
import dame from './dame.js';
import dancer from './dancer.js';
import director from './director.js';
import diver from './diver.js';
import dj from './dj.js';
import doomlord from './doomlord.js';
import dracfan from './dracfan.js';
import dragon from './dragon.js';
import drone from './drone.js';
import drum from './drum.js';
import drunk from './drunk.js';
import emo from './emo.js';
import engineer from './engineer.js';
import eurocrat from './eurocrat.js';
import extra from './extra.js';
import fan from './fan.js';
import flamenco from './flamenco.js';
import floridaman from './floridaman.js';
import folkie from './folkie.js';
import footballer from './footballer.js';
import foreman from './foreman.js';
import freebird from './freebird.js';
import frontman from './frontman.js';
import gangster from './gangster.js';
import gatekeeper from './gatekeeper.js';
import gator from './gator.js';
import gent from './gent.js';
import goblin from './goblin.js';
import gondolier from './gondolier.js';
import goon from './goon.js';
import goth from './goth.js';
import guardsman from './guardsman.js';
import hawker from './hawker.js';
import headbanger from './headbanger.js';
import headliner from './headliner.js';
import hippie from './hippie.js';
import hipster from './hipster.js';
import horse from './horse.js';
import hotdog from './hotdog.js';
import hxckid from './hxckid.js';
import ibex from './ibex.js';
import influencer from './influencer.js';
import kangaroo from './kangaroo.js';
import knight from './knight.js';
import lifeguard from './lifeguard.js';
import limodriver from './limodriver.js';
import macaw from './macaw.js';
import maestro from './maestro.js';
import makeup from './makeup.js';
import mascot from './mascot.js';
import matador from './matador.js';
import medic from './medic.js';
import merch from './merch.js';
import merchguy from './merchguy.js';
import metalhead from './metalhead.js';
import mime from './mime.js';
import mogul from './mogul.js';
import mosher from './mosher.js';
import mourner from './mourner.js';
import mouse from './mouse.js';
import mrbig from './mrbig.js';
import mummy from './mummy.js';
import neighbour from './neighbour.js';
import newsie from './newsie.js';
import ninja from './ninja.js';
import nonna from './nonna.js';
import nuguy from './nuguy.js';
import orc from './orc.js';
import pa from './pa.js';
import pallbearer from './pallbearer.js';
import paparazzo from './paparazzo.js';
import parrot from './parrot.js';
import pauser from './pauser.js';
import phone from './phone.js';
import pigeon from './pigeon.js';
import pirate from './pirate.js';
import pizzaiolo from './pizzaiolo.js';
import poet from './poet.js';
import poodle from './poodle.js';
import poolball from './poolball.js';
import poser from './poser.js';
import promoter from './promoter.js';
import punk from './punk.js';
import purist from './purist.js';
import rat from './rat.js';
import raver from './raver.js';
import reveler from './reveler.js';
import roadie from './roadie.js';
import robot from './robot.js';
import runner from './runner.js';
import salaryman from './salaryman.js';
import sambista from './sambista.js';
import scalper from './scalper.js';
import scarab from './scarab.js';
import scenekid from './scenekid.js';
import screamer from './screamer.js';
import security from './security.js';
import shredder from './shredder.js';
import skater from './skater.js';
import skeleton from './skeleton.js';
import skier from './skier.js';
import snowboarder from './snowboarder.js';
import soundguy from './soundguy.js';
import stbernard from './stbernard.js';
import stoner from './stoner.js';
import streetteam from './streetteam.js';
import stuntman from './stuntman.js';
import suit from './suit.js';
import sumo from './sumo.js';
import superfan from './superfan.js';
import surfer from './surfer.js';
import tapetrader from './tapetrader.js';
import toughguy from './toughguy.js';
import tourist from './tourist.js';
import troll from './troll.js';
import usher from './usher.js';
import vendor from './vendor.js';
import viking from './viking.js';
import waiter from './waiter.js';
import welder from './welder.js';
import wizard from './wizard.js';
import wolf from './wolf.js';
import wraith from './wraith.js';
import yeti from './yeti.js';
import yodeler from './yodeler.js';
import yokozuna from './yokozuna.js';
import zinekid from './zinekid.js';
import zombie from './zombie.js';
import { CAT_DEFS } from './cat.js';

/**
 * Every sculpted character in the library, by name: the default version of
 * each. Hand one to `createModel` (models/model.js) or a bake library.
 */
export const CHARACTERS = {
  agent, alien, archaeologist, artist, bat, beerguy, blackcat, blader, bobby, bouncer, brassman,
  brother, bull, cabbie, camel, candlekid, capoeira, clubber, cop, corgi, coroner, corpsepaint,
  cosplayer, count, cowboy, critic, croc, crow, crowdsurfer, cultist, cyclist, dame, dancer, director,
  diver, dj, doomlord, dracfan, dragon, drone, drum, drunk, emo, engineer, eurocrat, extra, fan,
  flamenco, floridaman, folkie, footballer, foreman, freebird, frontman, gangster, gatekeeper, gator,
  gent, goblin, gondolier, goon, goth, guardsman, hawker, headbanger, headliner, hippie, hipster,
  horse, hotdog, hxckid, ibex, influencer, kangaroo, knight, lifeguard, limodriver, macaw, maestro,
  makeup, mascot, matador, medic, merch, merchguy, metalhead, mime, mogul, mosher, mourner, mouse,
  mrbig, mummy, neighbour, newsie, ninja, nonna, nuguy, orc, pa, pallbearer, paparazzo, parrot,
  pauser, phone, pigeon, pirate, pizzaiolo, poet, poodle, poolball, poser, promoter, punk, purist,
  rat, raver, reveler, roadie, robot, runner, salaryman, sambista, scalper, scarab, scenekid,
  screamer, security, shredder, skater, skeleton, skier, snowboarder, soundguy, stbernard, stoner,
  streetteam, stuntman, suit, sumo, superfan, surfer, tapetrader, toughguy, tourist, troll, usher,
  vendor, viking, waiter, welder, wizard, wolf, wraith, yeti, yodeler, yokozuna, zinekid, zombie,
  ...CAT_DEFS,
};
