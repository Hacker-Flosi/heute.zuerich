// src/components/EventBlock.tsx

import { MdSportsSoccer } from 'react-icons/md'
import { Event, getEventColor, getTextColor, EVENT_TYPE_LABELS } from '@/lib/constants'
import styles from './EventBlock.module.css'

interface EventBlockProps {
  event: Event
  index: number
}

export default function EventBlock({ event, index }: EventBlockProps) {
  const isPublicViewing = event.eventType === 'public_viewing'
  const bgColor = getEventColor(event.colorIndex ?? index)
  const textColor = getTextColor(bgColor)
  const timeLabel = event.time && event.time !== '00:00' ? event.time : 'Ganztägig'

  const inner = isPublicViewing ? (
    <>
      <svg className={styles.ballBg} viewBox="0 0 30 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g transform="matrix(0.03,0,0,0.03,15,-166)">
          <g><g><g transform="translate(0,0)"><g transform="translate(0,7170)">
            <animateTransform repeatCount="indefinite" type="translate" attributeName="transform" dur="1.268s" begin="0s" calcMode="spline" values="0 7170; 0 7170; 0 6078.667; 0 7170; 0 6750.002; 0 7170; 0 7170" keyTimes="0; 0.026316; 0.256921; 0.512789; 0.756027; 0.999276; 1" keySplines="0 0 1 1; 0.043 0 0.137 1; 0.863 0 1 1; 0.167 0 0.137 1; 0.863 0 1 1; 0 0 1 1" fill="freeze" />
            <g transform="scale(18.5,18.5)">
              <animateTransform repeatCount="indefinite" type="scale" attributeName="transform" dur="1.268s" begin="0s" calcMode="spline" values="18.5 18.5; 18.5 16.5; 16.2 17.8; 17.5 17.5; 16.5 18.7; 16.5 18.7; 18.5 16.5; 16.2 17.8; 17.5 17.5; 16.5 18.7; 16.5 18.7; 16.5 18.7" keyTimes="0; 0.026316; 0.061053; 0.286947; 0.443263; 0.495394; 0.512789; 0.547526; 0.773421; 0.929736; 0.981875; 1" keySplines="0 0 1 1; 0.167 0.167 0.667 1; 0.333 0 0.667 1; 0.333 0 0.833 0.833; 0 0 1 1; 0 0 1 1; 0.167 0.167 0.667 1; 0.333 0 0.667 1; 0.333 0 0.833 0.833; 0 0 1 1; 0 0 1 1" fill="freeze" />
              <g transform="translate(-25,-25)">
                <g transform="matrix(1,0,0,1,25,25)">
                  <path strokeWidth="0.15" stroke="#ffffff" fill="#ffffff" fillRule="evenodd" d="M0,-22.958C2.48,-22.958,4.903,-22.566,7.214,-21.782C7.214,-21.782,7.476,-20.313,7.476,-20.313C7.476,-20.313,0.229,-19.583,0.229,-19.583C0.229,-19.583,-7.465,-20.537,-7.465,-20.537C-7.465,-20.537,-7.049,-21.836,-7.049,-21.836C-4.792,-22.565,-2.424,-22.958,0,-22.958ZM8.654,-20.18C8.654,-20.18,8.405,-21.377,8.405,-21.377C11.635,-20.096,14.542,-18.126,16.816,-15.624C16.816,-15.624,16.063,-15.712,16.063,-15.712C16.063,-15.712,8.654,-20.18,8.654,-20.18ZM-9.9,-4.319C-9.9,-4.319,-7.019,6.3,-7.019,6.3C-7.019,6.3,-11.513,13.097,-11.513,13.097C-11.513,13.097,-18.874,9.276,-18.874,9.276C-18.874,9.276,-21.019,0.976,-21.019,0.976C-21.019,0.976,-17.137,-6.451,-17.137,-6.451C-17.137,-6.451,-9.9,-4.319,-9.9,-4.319ZM-5.971,5.84C-5.971,5.84,-8.785,-4.519,-8.785,-4.519C-8.785,-4.519,0.228,-10.828,0.228,-10.828C0.228,-10.828,9.125,-4.747,9.125,-4.747C9.125,-4.747,5.86,5.84,5.86,5.84C5.86,5.84,-5.971,5.84,-5.971,5.84ZM-16.304,-14.538C-16.304,-14.538,-17.986,-7.306,-17.986,-7.306C-17.986,-7.306,-21.816,0.187,-21.816,0.187C-21.816,0.187,-22.957,-0.332,-22.957,-0.332C-22.833,-5.686,-20.916,-10.59,-17.764,-14.485C-17.764,-14.485,-16.304,-14.538,-16.304,-14.538ZM-20.113,11.041C-21.788,8.001,-22.768,4.54,-22.897,0.917C-22.897,0.917,-22.073,1.305,-22.073,1.305C-22.073,1.305,-19.868,9.672,-19.868,9.672C-19.868,9.672,-20.113,11.041,-20.113,11.041ZM-11.646,14.279C-11.646,14.279,-5.455,20.414,-5.455,20.414C-5.455,20.414,-7.07,21.868,-7.07,21.868C-12.088,20.223,-16.374,16.894,-19.257,12.496C-19.257,12.496,-18.883,10.521,-18.883,10.521C-18.883,10.521,-11.646,14.279,-11.646,14.279ZM6.606,21.982C4.548,22.633,2.329,22.958,0,22.958C-1.992,22.958,-3.984,22.688,-5.817,22.201C-5.817,22.201,-4.465,21.004,-4.465,21.004C-4.465,21.004,5.435,21.117,5.435,21.117C5.435,21.117,6.606,21.982,6.606,21.982ZM-4.405,19.888C-4.405,19.888,-10.595,13.753,-10.595,13.753C-10.595,13.753,-6.102,6.957,-6.102,6.957C-6.102,6.957,5.989,6.957,5.989,6.957C5.989,6.957,10.711,13.759,10.711,13.759C10.711,13.759,5.369,20.001,5.369,20.001C5.369,20.001,-4.405,19.888,-4.405,19.888ZM19.486,12.155C16.828,16.496,12.711,19.826,7.918,21.584C7.918,21.584,6.422,20.462,6.422,20.462C6.422,20.462,11.763,14.278,11.763,14.278C11.763,14.278,19.222,10.465,19.222,10.465C19.222,10.465,19.486,12.155,19.486,12.155ZM11.57,13.098C11.57,13.098,6.851,6.3,6.851,6.3C6.851,6.3,10.183,-4.544,10.183,-4.544C10.183,-4.544,17.366,-6.34,17.366,-6.34C17.366,-6.34,21.361,0.58,21.361,0.58C21.361,0.58,19.215,9.219,19.215,9.219C19.215,9.219,11.57,13.098,11.57,13.098ZM20.393,10.635C20.393,10.635,20.21,9.671,20.21,9.671C20.21,9.671,22.413,0.968,22.413,0.968C22.413,0.968,22.955,0.788,22.955,0.788C22.828,4.301,21.906,7.651,20.393,10.635ZM22.215,-0.147C22.215,-0.147,18.213,-7.193,18.213,-7.193C18.213,-7.193,16.589,-14.529,16.589,-14.529C16.589,-14.529,17.933,-14.375,17.933,-14.375C21.14,-10.368,22.889,-5.467,22.957,-0.395C22.957,-0.395,22.215,-0.147,22.215,-0.147ZM-9.511,-5.371C-9.511,-5.371,-16.801,-7.502,-16.801,-7.502C-16.801,-7.502,-15.062,-14.797,-15.062,-14.797C-15.062,-14.797,-8.057,-19.486,-8.057,-19.486C-8.057,-19.486,-0.303,-18.531,-0.303,-18.531C-0.303,-18.531,-0.303,-11.812,-0.303,-11.812C-0.303,-11.812,-9.511,-5.371,-9.511,-5.371ZM9.854,-5.598C9.854,-5.598,0.815,-11.812,0.815,-11.812C0.815,-11.812,0.815,-18.529,0.815,-18.529C0.815,-18.529,8.002,-19.259,8.002,-19.259C8.002,-19.259,15.404,-14.796,15.404,-14.796C15.404,-14.796,17.029,-7.392,17.029,-7.392C17.029,-7.392,9.854,-5.598,9.854,-5.598ZM-8.65,-20.409C-8.65,-20.409,-15.721,-15.714,-15.721,-15.714C-15.721,-15.714,-16.769,-15.666,-16.769,-15.666C-14.445,-18.171,-11.54,-20.141,-8.313,-21.371C-8.313,-21.371,-8.65,-20.409,-8.65,-20.409ZM-24.075,0C-24.075,13.293,-13.292,24.075,0,24.075C13.293,24.075,24.075,13.293,24.075,0C24.075,-13.235,13.35,-24.075,0,-24.075C-13.292,-24.075,-24.075,-13.292,-24.075,0Z" />
                </g>
              </g>
            </g>
          </g></g></g></g>
        </g>
      </svg>
      <div className={styles.meta}>
        <div className={styles.metaTop}>
          <div className={styles.badgeGroup}>
            <MdSportsSoccer className={styles.publicViewingIcon} />
            <span className={`${styles.categoryPill} ${styles.publicViewingBadge}`}>
              {EVENT_TYPE_LABELS['public_viewing']}
            </span>
          </div>
          <span className={styles.time}>{timeLabel}</span>
        </div>
        <span className={styles.location}>{event.location}</span>
      </div>
      <div className={styles.name}>{event.name}</div>
    </>
  ) : (
    <>
      {event.sponsored && (
        <span className={styles.sponsoredBadge}>Gesponsert</span>
      )}
      <div className={styles.meta}>
        <div className={styles.metaTop}>
          {event.eventType && (
            <span className={styles.categoryPill}>
              {EVENT_TYPE_LABELS[event.eventType]}
            </span>
          )}
          <span className={styles.time}>{timeLabel}</span>
        </div>
        <span className={styles.location}>{event.location}</span>
      </div>
      <div className={styles.nameRow}>
        <div className={styles.name}>{event.name}</div>
        {event.spotifyUrl && (
          <button
            className={styles.spotifyLink}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(event.spotifyUrl, '_blank', 'noopener,noreferrer') }}
            aria-label="Auf Spotify anhören"
          >
            Spotify ↗
          </button>
        )}
      </div>
    </>
  )

  return (
    <li className={styles.item} style={{ '--i': index } as React.CSSProperties}>
      {event.url ? (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.link}${isPublicViewing ? ` ${styles.publicViewingLink}` : ''}`}
          style={isPublicViewing ? undefined : { backgroundColor: bgColor, color: textColor }}
        >
          {inner}
        </a>
      ) : (
        <div
          className={`${styles.link} ${styles.noLink}${isPublicViewing ? ` ${styles.publicViewingLink}` : ''}`}
          style={isPublicViewing ? undefined : { backgroundColor: bgColor, color: textColor }}
        >
          {inner}
        </div>
      )}
    </li>
  )
}
